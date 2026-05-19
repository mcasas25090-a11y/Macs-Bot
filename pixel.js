import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const databasePath = path.join(process.cwd(), 'jsons', 'preferencias.json');
const prefixPath = path.join(process.cwd(), 'jsons', 'prefix.json');
const tmpDir = path.join(process.cwd(), 'tmp');

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const groupCache = new Map();

export const pixelHandler = async (conn, m, config) => {
    try {
        if (!m || !m.message) return;
        const chat = m.key.remoteJid;
        if (chat === 'status@broadcast') return;

        const myJid = conn.user.id.split('@')[0].split(':')[0].replace(/\D/g, '');

        const subSessionsPath = path.resolve('./sesiones_subbots');
        const moodSessionsPath = path.resolve('./sesiones_moods');
        let sessionFolder = '';

        const subPathJid = path.join(subSessionsPath, myJid);
        const moodPathJid = path.join(moodSessionsPath, myJid);

        if (await fs.pathExists(subPathJid)) {
            sessionFolder = subPathJid;
        } else if (await fs.pathExists(moodPathJid)) {
            sessionFolder = moodPathJid;
        }

        if (sessionFolder) {
            const selfFilePath = path.join(sessionFolder, 'self_status.json');
            if (await fs.pathExists(selfFilePath)) {
                const selfData = await fs.readJson(selfFilePath).catch(() => ({}));
                if (selfData.selfMode && !m.key.fromMe) return; 
            }
        }

        const sender = m.sender;
        const isGroup = chat.endsWith('@g.us');

        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            let groupMetadata = groupCache.get(chat);
            if (!groupMetadata || (Date.now() - groupMetadata.time > 10000)) {
                groupMetadata = await conn.groupMetadata(chat).catch(() => ({}));
                if (groupMetadata.id) {
                    groupMetadata.time = Date.now();
                    groupCache.set(chat, groupMetadata);
                }
            }
            const participants = groupMetadata.participants || [];
            const userParticipant = participants.find(p => p.id === sender) || {};
            isAdmin = userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin' || false;
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = participants.find(p => p.id === botJid) || {};
            isBotAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin' || false;
        }

        const ownerNumbers = config.owner.map(id => (typeof id === 'string' ? id : id[0]).replace(/\D/g, ''));
        const senderNumber = sender.split('@')[0].replace(/\D/g, '');

        const isRealOwner = senderNumber === ownerNumbers[0];
        const isListedOwner = ownerNumbers.includes(senderNumber) || m.key.fromMe;

        const type = Object.keys(m.message)[0];
        let body = '';
        if (type === 'conversation') body = m.message.conversation;
        else if (type === 'extendedTextMessage') body = m.message.extendedTextMessage.text;
        else if (m.message[type] && m.message[type].caption) body = m.message[type].caption;

        if (!body && !m.quoted) return;

        let activePrefixes = config.allPrefixes || ['#', '!', '.'];
        if (await fs.pathExists(prefixPath)) {
            try {
                const prefixData = await fs.readJson(prefixPath).catch(() => ({}));
                if (prefixData.selected) activePrefixes = [prefixData.selected];
            } catch (e) {}
        }

        const foundPrefix = activePrefixes.find(p => body.startsWith(p));
        const usedPrefix = foundPrefix ? foundPrefix : '';

        let commandName = foundPrefix 
            ? body.slice(foundPrefix.length).trim().split(/ +/).shift().toLowerCase()
            : body.trim().split(/ +/).shift().toLowerCase();

        if (!isGroup && !isRealOwner) {
            const allowedPrivateCmds = ['code', 'codemood', 'setname', 'setbanner', 'self'];
            if (!allowedPrivateCmds.includes(commandName)) return; 
        }

        if (isGroup) {
            const comandosGestion = ['setprimary', 'delprimary', 'sockets', 'bots', 'codemood'];
            if (!comandosGestion.includes(commandName)) {
                if (await fs.pathExists(databasePath)) {
                    let db = await fs.readJson(databasePath).catch(() => ({}));
                    if (db[chat]) {
                        const primaryNumber = db[chat].replace(/\D/g, '');
                        if (myJid !== primaryNumber) return; 
                    }
                }
            }
        }

        const args = body.trim().split(/ +/).slice(1);
        let text = args.join(' ');

        const cmd = global.commands.get(commandName) || 
                    Array.from(global.commands.values()).find(c => c.alias && c.alias.includes(commandName));

        if (foundPrefix && !cmd) {
            if (!isGroup && !isRealOwner) return;
            return m.reply(`*${config.visuals.emoji2}* El comando \`${usedPrefix}${commandName}\` no fue encontrado.\n> Para ver mi lista completa de comandos usa:\n» *${usedPrefix}help*`);
        }

        if (!cmd) return;
        if (!foundPrefix && !cmd.noPrefix) return;

        if (cmd.isAdmin && isGroup && !isAdmin && !isRealOwner) {
            return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\` *${config.visuals.emoji2}*\n\n> Esta función es exclusiva para administradores del grupo.`);
        }

        if (cmd.isBotAdmin && isGroup && !isBotAdmin) {
            return m.reply(`*${config.visuals.emoji2}* \`NECESITO SER ADMIN\` *${config.visuals.emoji2}*\n\n> No puedo ejecutar esta acción sin los permisos de administración necesarios.`);
        }

        if (cmd.isOwner && !isRealOwner && !isListedOwner) {
            return m.reply(`*${config.visuals.emoji2}* \`ACCESO RESTRINGIDO\` *${config.visuals.emoji2}*\n\n> Esta función es exclusiva para mi desarrollador.`);
        }

        if (cmd.isGroup && !isGroup) {
            return m.reply(`*${config.visuals.emoji4}* \`SÓLO PARA GRUPOS\` *${config.visuals.emoji4}*\n\n> Este comando requiere una comunidad activa para ser ejecutado.`);
        }

        const subPath = path.join(subSessionsPath, myJid, 'settings.json');
        const moodPath = path.join(moodSessionsPath, myJid, 'settings.json');
        let sessionSettings = {};

        if (await fs.pathExists(subPath)) {
            sessionSettings = await fs.readJson(subPath).catch(() => ({}));
        } else if (await fs.pathExists(moodPath)) {
            sessionSettings = await fs.readJson(moodPath).catch(() => ({}));
        }

        global.dynamicBotConfig = {
            botName: sessionSettings.shortName || config.botName || 'Kazuma',
            botLongName: sessionSettings.longName || config.botName || 'Kazuma',
            botBanner: sessionSettings.banner || config.visuals.img1
        };

        if (m.message[type] && m.message[type].contextInfo) {
            m.mentionedJid = m.message[type].contextInfo.mentionedJid || [];
        } else {
            m.mentionedJid = [];
        }

        await cmd.run(conn, m, args, usedPrefix, commandName, text);

    } catch (err) {
        console.error(chalk.red('[ERROR PIXEL]'), err);
    }
};