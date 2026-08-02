import { 
    makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    Browsers,
    jidNormalizedUser,
    downloadMediaMessage 
} from '@whiskeysockets/baileys';
import P from 'pino';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import { socketLogger } from './print.js';
import { pixelHandler } from '../pixel.js';
import { config } from '../config.js';

const sessionsPath = path.resolve('./sesiones_subbots');
if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath, { recursive: true });

const msgRetryCounterCache = new NodeCache();
global.subBots = new Map();

export const startSubBot = async (userId, mainConn = null) => {
    const jid = jidNormalizedUser(userId);
    const userNumber = jid.split('@')[0];
    const userSessionPath = path.join(sessionsPath, userNumber);

    const { state, saveCreds } = await useMultiFileAuthState(userSessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
        },
        // Identidad de navegador para Macs Bot
        browser: Browsers.ubuntu(config.botName || 'Macs SubBot'), 
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        shouldIgnoreJid: jid => isNaN(jid.split('@')[0])
    });

    global.subBots.set(jid, sock);

    sock.ev.on('creds.update', async () => {
        await saveCreds();
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const reason = new Error(lastDisconnect?.error)?.message;

            if (code !== DisconnectReason.loggedOut) {
                console.log(chalk.yellow(`[⚙️ SUB-MACS] Reintentando conexión: ${userNumber} | Motivo: ${reason}`));
                setTimeout(() => startSubBot(jid, mainConn), 5000);
            } else {
                console.log(chalk.red(`[🚫 SUB-MACS] Sesión cerrada permanentemente: ${userNumber}`));
                global.subBots.delete(jid);
                if (fs.existsSync(userSessionPath)) fs.rmSync(userSessionPath, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            console.log(chalk.green(`[✅ SUB-MACS] Nodo Activo: ${userNumber}`));
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return;
            let rawMsg = chatUpdate.messages[0];
            if (!rawMsg.message) return;
            if (rawMsg.key && rawMsg.key.remoteJid === 'status@broadcast') return;

            const m = smsg(sock, rawMsg);

            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const isRealOwner = m.sender.includes(realOwnerNumber) || m.key.fromMe;

            if (!m.isGroup && !isRealOwner) {
                const prefixes = config.allPrefixes || ['#', '!', '.'];
                const body = m.text || '';
                const foundPrefix = prefixes.find(p => body.startsWith(p));
                const commandName = foundPrefix 
                    ? body.slice(foundPrefix.length).trim().split(/ +/).shift().toLowerCase()
                    : body.trim().split(/ +/).shift().toLowerCase();

                const allowedPrivateCmds = ['code', 'codemood', 'setname', 'setbanner'];
                if (!allowedPrivateCmds.includes(commandName)) return;
            }

            socketLogger(m, sock);
            await pixelHandler(sock, m, config);

        } catch (err) {
            console.error(chalk.red('[❌ ERROR SUB-MACS]'), err);
        }
    });

    return sock;
};

// Utilidad adaptada sin cambios mayores, estandariza el objeto del mensaje
function smsg(conn, m) {
    if (!m) return m;
    let M = m.key;
    if (M) {
        m.chat = jidNormalizedUser(M.remoteJid);
        m.fromMe = M.fromMe;
        m.id = M.id;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : m.participant || m.key.participant || m.chat || '');
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0];
        m.body = m.message.conversation || m.message[m.mtype]?.caption || m.message[m.mtype]?.text || (m.mtype === 'listResponseMessage') && m.message[m.mtype]?.singleSelectReply?.selectedRowId || (m.mtype === 'buttonsResponseMessage') && m.message[m.mtype]?.selectedButtonId || (m.mtype === 'templateButtonReplyMessage') && m.message[m.mtype]?.selectedId || m.message[m.mtype] || '';
        m.text = typeof m.body === 'string' ? m.body : '';

        let quoted = m.message[m.mtype]?.contextInfo?.quotedMessage || null;
        if (quoted) {
            let qMtype = Object.keys(quoted)[0];
            m.quoted = quoted[qMtype];
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            m.quoted.mtype = qMtype;
            m.quoted.id = m.message[m.mtype].contextInfo.stanzaId;
            m.quoted.chat = jidNormalizedUser(m.message[m.mtype].contextInfo.remoteJid || m.chat);
            m.quoted.isGroup = m.quoted.chat.endsWith('@g.us');
            m.quoted.sender = jidNormalizedUser(m.message[m.mtype].contextInfo.participant);
            m.quoted.fromMe = m.quoted.sender === jidNormalizedUser(conn.user && conn.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || '';
            m.quoted.download = () => downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: P({ level: 'silent' }) });
        } else {
            m.quoted = null;
        }
    }
    m.reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m });
    m.download = () => downloadMediaMessage(m, 'buffer', {}, { logger: P({ level: 'silent' }) });
    return m;
}

export const loadAllSubBots = async (mainConn) => {
    if (!fs.existsSync(sessionsPath)) return;
    const sessions = fs.readdirSync(sessionsPath);
    console.log(chalk.cyan(`[🚀 SISTEMA MACS] Reanudando ${sessions.length} sub-bots...`));
    for (const num of sessions) {
        if (num.includes('.') || isNaN(num)) continue; 
        const jid = `${num}@s.whatsapp.net`;
        await new Promise(resolve => setTimeout(resolve, 3000));
        startSubBot(jid, mainConn);
    }
};