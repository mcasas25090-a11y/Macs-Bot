import { config } from '../config.js';
import fs from 'fs-extra';
import path from 'path';

const setBotName = {
    name: 'setname',
    alias: ['setbotname', 'botname', 'nombrebot'],
    category: 'sockets',
    desc: 'Configura el nombre del bot (Principal o Sockets).',
    noPrefix: true,

    run: async (conn, m, args) => {
        try {
            const from = m.chat;
            const user = m.sender.split('@')[0].split(':')[0];
            const botNumber = conn.user.id.split(':')[0].replace(/\D/g, '');

            const subSessionsPath = path.resolve('./sesiones_subbots');
            const moodSessionsPath = path.resolve('./sesiones_moods');
            
            const isSubBot = await fs.pathExists(path.join(subSessionsPath, botNumber));
            const isMoodBot = await fs.pathExists(path.join(moodSessionsPath, botNumber));

            const fullText = args.join(' ');
            if (!fullText) return m.reply(`*${config.visuals.emoji2}* Uso: #setname Corto/Nombre Largo\nEjemplo: #setname Macs/Macs Bot Pro`);

            let shortName, longName;
            if (fullText.includes('/')) {
                let [part1, ...part2] = fullText.split('/');
                shortName = part1.trim();
                longName = part2.join('/').trim();
            } else {
                shortName = fullText.trim();
                longName = fullText.trim();
            }

            // LÓGICA PARA EL BOT PRINCIPAL (MACS OWNER)
            if (!isSubBot && !isMoodBot) {
                config.botName = longName; // Actualiza el nombre en la configuración en memoria
                return await m.reply(`*${config.visuals.emoji3} \`NOMBRE PRINCIPAL ACTUALIZADO\` ${config.visuals.emoji3}*\n\n*Nombre:* ${longName}\n\n> ¡Listo Macs! El nombre del bot principal ha sido cambiado.`);
            }

            // LÓGICA PARA SUB-BOTS
            if (botNumber !== user) {
                return await conn.sendMessage(from, { 
                    text: `*${config.visuals.emoji2}* Solo el dueño absoluto de esta sesión puede personalizar su nombre.` 
                }, { quoted: m });
            }

            let userSettingsPath = isSubBot 
                ? path.join(subSessionsPath, botNumber, 'settings.json') 
                : path.join(moodSessionsPath, botNumber, 'settings.json');

            let localConfig = (await fs.pathExists(userSettingsPath)) ? await fs.readJson(userSettingsPath) : {};
            localConfig.shortName = shortName;
            localConfig.longName = longName;
            localConfig.lastUpdate = Date.now();

            await fs.writeJson(userSettingsPath, localConfig, { spaces: 2 });
            await m.reply(`*${config.visuals.emoji3} \`CONFIGURACIÓN SOCKET\` ${config.visuals.emoji3}*\n\n*Corto:* ${shortName}\n*Largo:* ${longName}\n\n> Ajuste aplicado correctamente.`);
            
        } catch (e) {
            await m.reply(`*${config.visuals.emoji2}* Error al guardar el nombre.`);
        }
    }
};

export default setBotName;
