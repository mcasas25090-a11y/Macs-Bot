import { 
    makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    Browsers,
    downloadMediaMessage
} from 'todleys';
import P from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createInterface } from 'readline';
import chalk from 'chalk';
import CFonts from 'cfonts';

import { config } from './config.js';
import { logger } from './config/print.js';
import { pixelHandler } from './pixel.js';
import { database } from './database.js';

import { detectHandler } from './comandos/grupos-detect.js';
import antiLinkHandler from './comandos/grupos-antilink.js';
import welcomeHandler from './comandos/grupos-welcome.js';
import { loadAllSubBots } from './sockets/index.js';
import { loadAllMoodBots } from './sockets/SubMoods/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

global.commands = new Map();
global.lastMessageMap = new Map();
let startTime = Date.now();

const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

setInterval(() => {
    try {
        const files = fs.readdirSync(tmpDir);
        const now = Date.now();
        for (const file of files) {
            const filePath = path.join(tmpDir, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs > 5 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (e) {}
}, 60 * 1000);

global.db = {
    data: {
        chats: {},
        users: {},
        characters: {},
        settings: {}
    }
};

global.loadCommands = async () => {
    const commandsPath = path.resolve(__dirname, 'comandos');
    if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);
    global.commands.clear();
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    await Promise.all(files.map(async (file) => {
        try {
            const filePath = path.join(commandsPath, file);
            const fileUrl = pathToFileURL(filePath).href;
            const module = await import(`${fileUrl}?update=${Date.now()}`);
            if (module.default && module.default.name) {
                global.commands.set(module.default.name.toLowerCase(), module.default);
            }
        } catch (e) {}
    }));
};

async function startBot() {
    const sessionDir = './sesion_bot';
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
        },
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => { return null }
    });

    conn.getAdminStatus = async (groupJid, senderJid) => {
        const botJid = conn.authState?.creds?.me?.id;
        const meta = await conn.groupMetadata(groupJid).catch(() => null);
        if (!meta || !Array.isArray(meta.participants)) {
            return { isAdmin: false, isBotAdmin: false };
        }
        const normalize = (j) => j.split('@')[0].split(':')[0];
        const senderNorm = normalize(senderJid);
        const botNorm = normalize(botJid);
        const isAdmin = meta.participants.some(p => normalize(p.id || p.jid) === senderNorm && (p.admin === 'admin' || p.admin === 'superadmin'));
        const isBotAdmin = meta.participants.some(p => normalize(p.id || p.jid) === botNorm && (p.admin === 'admin' || p.admin === 'superadmin'));
        return { isAdmin, isBotAdmin };
    };

    await global.loadCommands();

    try {
        detectHandler(conn);
        welcomeHandler(conn);
    } catch (e) {}

    if (!conn.authState.creds.registered) {
        setTimeout(async () => {
            let input = await question(chalk.cyan('\n  [?] Introduce tu número con código de país:\n  > '));
            let phoneNumber = input.replace(/[^0-9]/g, '');
            try {
                let code = await conn.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(chalk.black.bgCyan(`\n  CODIGO DE VINCULACIÓN: ${code}  \n`));
            } catch (error) {
                console.error('Error al generar código:', error);
            }
        }, 3000);
    }

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('[!] Sesión cerrada. Elimina la carpeta sesion_bot.'));
                process.exit();
            } else {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            process.stdout.write('\x1Bc');
            CFonts.say('KAZUMA', { font: 'block', align: 'center', colors: ['cyan', 'magenta'] });
            console.log(chalk.greenBright.bold(`\n  [✨] ¡KAZUMA CONECTADO!\n  [⌚] Tiempo de carga: ${((Date.now() - startTime) / 1000).toFixed(2)}s`));
            await loadAllSubBots(conn);
            await loadAllMoodBots(conn);
        }
    });

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m || !m.message) return;
        if (m.key.remoteJid === 'status@broadcast') return;

        const messageTimestamp = (m.messageTimestamp?.low || m.messageTimestamp || Date.now()) * 1000;
        if ((Date.now() - messageTimestamp) > 180000) return;

        m.chat = m.key.remoteJid;
        m.sender = conn.decodeJid ? conn.decodeJid(m.key.participant || m.key.remoteJid) : (m.key.participant || m.key.remoteJid);
        const isGroup = m.chat.endsWith('@g.us');

        let dbUser = await database.getUser(m.sender);
        if (!dbUser) {
            dbUser = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z' };
            await database.saveUser(m.sender, dbUser);
        }
        global.db.data.users[m.sender] = dbUser;

        if (isGroup) {
            let dbChat = await database.getChat(m.chat);
            if (!dbChat) {
                dbChat = { welcome: 1, antilink: 1, detect: 1 };
                await database.saveChat(m.chat, dbChat);
            }
            global.db.data.chats[m.chat] = dbChat;
        }

        global.lastMessageMap.set(m.sender, Date.now());
        m.reply = async (text) => conn.sendMessage(m.chat, { text }, { quoted: m });
        m.download = async () => downloadMediaMessage(m, 'buffer', {}, { logger: P({ level: 'silent' }) });

        const msgType = Object.keys(m.message)[0];
        const contextInfo = m.message[msgType]?.contextInfo;

        if (contextInfo?.quotedMessage) {
            const type = Object.keys(contextInfo.quotedMessage)[0];
            const q = contextInfo.quotedMessage[type];
            m.quoted = {
                type, msg: q, id: contextInfo.stanzaId, mimetype: q?.mimetype || '',
                sender: contextInfo.participant,
                text: q?.text || q?.caption || contextInfo.quotedMessage.conversation || '',
                key: {
                    remoteJid: m.chat,
                    fromMe: contextInfo.participant === (conn.user.id.split(':')[0] + '@s.whatsapp.net'),
                    id: contextInfo.stanzaId, participant: contextInfo.participant
                },
                message: contextInfo.quotedMessage,
                download: async () => downloadMediaMessage({ message: contextInfo.quotedMessage }, 'buffer', {}, { logger: P({ level: 'silent' }) })
            };
        } else {
            m.quoted = null;
        }

        logger(m, conn);
        await antiLinkHandler(conn, m);

        await pixelHandler(conn, m, config);

        try {
            if (global.db.data.users[m.sender]) {
                await database.saveUser(m.sender, global.db.data.users[m.sender]);
            }
            if (isGroup && global.db.data.chats[m.chat]) {
                await database.saveChat(m.chat, global.db.data.chats[m.chat]);
            }
        } catch (dbErr) {
            console.error(dbErr);
        }
    });
}

startBot();