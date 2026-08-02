import { config } from '../config.js';
import fs from 'fs-extra';
import path from 'path';

const menuCommand = {
    name: 'menu',
    alias: ['help', 'ayuda', 'menú', 'hel'],
    category: 'main',
    desc: 'Muestra la lista de comandos dinámica.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix) => {
        try {
            // Usamos el prefijo que activó el bot o el predeterminado
            const prefix = usedPrefix || config.prefix; 
            const userJid = m.sender.replace(/:.*@/g, '@');
            const userShortId = userJid.split('@')[0];
            const group = m.chat;

            // Extraemos los comandos
            const commandsSource = conn.commands || global.commands;
            if (!commandsSource) return m.reply('❌ Error: No se pudo acceder a la lista de comandos.');

            const allCommands = Array.from(commandsSource.values());

            // Agrupamos por categoría omitiendo 'todos' y 'main'
            const categories = [...new Set(allCommands
                .map(cmd => cmd.category)
                .filter(cat => cat && cat !== 'todos' && cat !== 'main')
            )];

            // Comprobación de SubBots / Moods
            const botNumber = conn.user.id.split(':')[0].replace(/\D/g, '');
            const subSessionsPath = path.resolve('./sesiones_subbots');
            const moodSessionsPath = path.resolve('./sesiones_moods');
            let settingsPath = '';
            let currentBotType = 'Bot Principal';

            if (await fs.pathExists(path.join(subSessionsPath, botNumber))) {
                settingsPath = path.join(subSessionsPath, botNumber, 'settings.json');
                currentBotType = 'SubBot';
            } else if (await fs.pathExists(path.join(moodSessionsPath, botNumber))) {
                settingsPath = path.join(moodSessionsPath, botNumber, 'settings.json');
                currentBotType = 'Mood';
            }

            let displayLongName = config.botName;
            let displayBanner = config.visuals.img1;

            if (settingsPath && await fs.pathExists(settingsPath)) {
                const localData = await fs.readJson(settingsPath);
                if (localData.longName) displayLongName = localData.longName;
                if (localData.banner) displayBanner = localData.banner;
            }

            // Datos del usuario desde la memoria (cargados en index.js)
            const userGlobal = global.db.data.users[userJid] || {};
            const wallet = (userGlobal.wallet || 0) + (userGlobal.bank || 0);

            const groupData = global.db.data.chats[group] || {};
            const userRpg = groupData.rpg?.[userJid] || {};

            const rank = userRpg.rank || 'Explorador Novato';
            const diamantes = userRpg.minerals?.diamantes || 0;

            // Identidad actualizada a Macs Bot
            const infoBot = `┏━━━━${config.visuals.emoji2} 𝐈𝐍𝐅𝐎-𝐁𝐎𝐓 ${config.visuals.emoji2}━━━━╮
┃ ${config.visuals.emoji} *Bot* » ${displayLongName}
┃ ${config.visuals.emoji3} *Tipo* » ${currentBotType}
┃ 💠 *Prefijo* » [ ${prefix} ]
╰━━━━━━━━━━━━━━━━━━━╯\n`;

            const infoUser = `┏━━━━${config.visuals.emoji2} 𝐈𝐍𝐅𝐎-𝐔𝐒𝐄𝐑 ${config.visuals.emoji2}━━━━╮
┃ 👤 *Usuario* »  @${userShortId}
┃ 🌟 *Rango* » ${rank}
┃ 💰 *Coins* » ¥${wallet.toLocaleString()}
┃ 💎 *Diamantes* » ${diamantes}
╰━━━━━━━━━━━━━━━━━━━╯`;

            // Formateador de categorías visualmente atractivo
            const formatCategory = (cat) => {
                const cmdsInCat = allCommands.filter(cmd => cmd.category === cat);
                let catText = `\n*» ━━━ \`${cat.toUpperCase()}\` ━━━ «*\n> ${config.visuals.emoji} Comandos de la categoría ${cat}.\n\n`;

                const body = cmdsInCat.map(cmd => {
                    const allAliases = [cmd.name, ...(cmd.alias || [])];
                    const namesString = allAliases.map(n => `*${prefix}${n}*`).join(' • ');
                    return ` ${config.visuals.emoji4} ${namesString}\n> ↳ ${cmd.desc || 'Sin descripción.'}`;
                }).join('\n');

                return catText + body + '\n';
            };

            const input = args[0]?.toLowerCase();
            let finalBody = "";
            let subHeader = "";

            if (!input) {
                subHeader = `*☞︎︎︎ Lista completa de comandos ☜︎︎︎*\n\n`;
                finalBody = categories.map(cat => formatCategory(cat)).join('\n');
            } else if (categories.includes(input)) {
                subHeader = `*☞︎︎︎ Comandos: \`${input.toUpperCase()}\` ☜︎︎︎*\n\n`;
                finalBody = formatCategory(input);
            } else {
                let catList = categories.map(cat => `› ${cat}`).join('\n');
                let errorMsg = `*${config.visuals.emoji2} \`Categoría no encontrada\` ${config.visuals.emoji2}*\n\n» La categoría *${input}*, no fue encontrada.\n\n${config.visuals.emoji3} *Categorías existentes* »\n${catList}\n\n> ¡Si necesitas el menú completo, simplemente escribe *${prefix}help!*`;
                return m.reply(errorMsg);
            }

            let header = `¡Hola! Soy ${displayLongName}.\n\n`;
            let textoMenu = `${header}${infoBot}\n${infoUser}\n${subHeader}${finalBody}`;

            await conn.sendMessage(m.chat, { 
                image: { url: displayBanner }, 
                caption: textoMenu,
                mentions: [userJid] // Asegura que se etiquete al usuario en el mensaje
            }, { quoted: m });

        } catch (err) {
            console.error('Error en el menú:', err);
            m.reply('❌ Ocurrió un error al generar el menú.');
        }
    }
};

export default menuCommand;
