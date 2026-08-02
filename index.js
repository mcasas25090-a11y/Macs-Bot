import { 
    makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    Browsers,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
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

// Limpieza automática de la carpeta temporal
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

// Estructura global en memoria para la Base de Datos
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
        } catch (e) {
            console.error(chalk.red(`[❌ ERROR] Falló al cargar comando: ${file}`), e);
        }
    }));
};

// --- Control de estado de pairing (evita pedir el número dos veces) ---
let pairingPhoneNumber = null;
let pairingInProgress = false;
let botStarting = false;

async function startBot() {
    // Evita que dos instancias de startBot corran al mismo tiempo
    if (botStarting) return;
    botStarting = true;

    const sessionDir = './sesion_bot';
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let version;
    try {
        ({ version } = await fetchLatestBaileysVersion());
    } catch (e) {
        console.log(chalk.yellow('[⚠️] No se pudo obtener la última versión de WhatsApp Web, usando la versión por defecto.'));
        version = undefined;
    }

    const conn = makeWASocket({
        version,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
        },
        // Identidad de Macs Bot en dispositivos vinculados
        browser: Browsers.ubuntu(config.botName || 'Macs Bot'),
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

    if (!conn.authState.creds.registered && !pairingInProgress) {
        pairingInProgress = true;
        setTimeout(async () => {
            try {
                // Solo pregunta el número si aún no lo tenemos guardado de un intento anterior
                if (!pairingPhoneNumber) {
                    const input = await question(chalk.cyan(`\n  ${config.visuals.emoji2} Introduce tu número con código de país (Ej: 51999999999):\n  > `));
                    pairingPhoneNumber = input.replace(/[^0-9]/g, '');
                }
                let code = await conn.requestPairingCode(pairingPhoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(chalk.black.bgCyan(`\n  💠 CÓDIGO DE VINCULACIÓN: ${code}  \n`));
                console.log(chalk.cyan(`  Ingresa este código en WhatsApp AHORA (tienes muy poco tiempo antes de que expire).\n`));
            } catch (error) {
                console.error(chalk.red('❌ Error al generar código de vinculación:'), error);
                pairingPhoneNumber = null; // permite reintentar con otro número si falló
            } finally {
                pairingInProgress = false;
            }
        }, 3000);
    }

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            botStarting = false;

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('[🚫] Sesión cerrada. Elimina la carpeta sesion_bot y vuelve a escanear/vincular.'));
                process.exit();
            } else if (pairingInProgress || (!conn.authState.creds.registered && pairingPhoneNumber)) {
                // Si estamos a mitad del proceso de vinculación, NO reconectamos automáticamente:
                // eso generaría un código nuevo e invalidaría el que el usuario está ingresando.
                console.log(chalk.yellow('[⏳] Conexión cerrada durante la vinculación. Esperando a que ingreses el código...'));
            } else {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            pairingPhoneNumber = null;
            pairingInProgress = false;
            process.stdout.write('\x1Bc');

            // Nuevo Banner para Macs Bot
            CFonts.say('MACS BOT', { font: 'block', align: 'center', colors: ['cyan', 'blue'] });

            console.log(chalk.cyanBright.bold(`\n  [🚀] ¡MACS BOT INICIADO CORRECTAMENTE!\n  [⌚] Tiempo de carga: ${((Date.now() - startTime) / 1000).toFixed(2)}s`));

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

        // Integración con Base de Datos SQL
        let dbUser = await database.getUser(m.sender);
        if (!dbUser) {
            dbUser = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: new Date().toISOString() };
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

        // Ejecución de Handlers
        logger(m, conn);
        await antiLinkHandler(conn, m);
        await pixelHandler(conn, m, config);

        // Guardado posterior en BD
        try {
            await database.saveUser(m.sender, global.db.data.users[m.sender]);
            if (isGroup) await database.saveChat(m.chat, global.db.data.chats[m.chat]);
        } catch (dbErr) {
            console.error(chalk.red('[❌ ERROR DB] Fallo al guardar en la base de datos:'), dbErr);
        }
    });
}

startBot();