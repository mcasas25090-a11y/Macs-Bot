import { config } from '../config.js';
import fs from 'fs-extra';
import path from 'path';

const setBanner = {
    name: 'setbanner',
    alias: ['setimg', 'bannerbot'],
    category: 'sockets',
    desc: 'Cambia la imagen de banner de tu Socket personal guardándola localmente.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            const from = m.chat;
            const user = m.sender.split('@')[0].split(':')[0];
            const botNumber = conn.user.id.split(':')[0].replace(/\D/g, '');

            const subSessionsPath = path.resolve('./sesiones_subbots');
            const moodSessionsPath = path.resolve('./sesiones_moods');

            const isSubBot = await fs.pathExists(path.join(subSessionsPath, botNumber));
            const isMoodBot = await fs.pathExists(path.join(moodSessionsPath, botNumber));

            if (!isSubBot && !isMoodBot) {
                return await conn.sendMessage(from, { 
                    text: `*${config.visuals.emoji2} \`Comando exclusivo\` ${config.visuals.emoji2}*\n\n» Este comando no está disponible en el socket principal.\n\n> ¡Intenta usarlo desde la sesión del socket!` 
                }, { quoted: m });
            }

            if (botNumber !== user) {
                return await conn.sendMessage(from, { 
                    text: `*${config.visuals.emoji2}* Solo el dueño absoluto de esta sesión puede personalizar su banner.` 
                }, { quoted: m });
            }

            const q = m.quoted ? m.quoted : m;
            const mime = (q.msg || q).mimetype || q.mediaType || '';

            if (!mime || !/image/.test(mime)) {
                return await conn.sendMessage(from, { 
                    text: `*${config.visuals.emoji2}* Responde a una imagen con el comando para establecer tu banner.` 
                }, { quoted: m });
            }

            await conn.sendMessage(from, { text: `*${config.visuals.emoji3}* \`GUARDANDO BANNER LOCALMENTE...\`` }, { quoted: m });

            const media = await q.download();
            if (!media) throw new Error('No se pudo descargar la imagen.');

            // Determinar la ruta de la sesión del bot actual
            const sessionDir = isSubBot 
                ? path.join(subSessionsPath, botNumber) 
                : path.join(moodSessionsPath, botNumber);

            const userSettingsPath = path.join(sessionDir, 'settings.json');

            // Definir la extensión y guardar el archivo de imagen de forma local
            const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg';
            const bannerFileName = `banner${ext}`;
            const bannerFilePath = path.join(sessionDir, bannerFileName);

            await fs.writeFile(bannerFilePath, media);

            // Actualizar la configuración local
            let localConfig = (await fs.pathExists(userSettingsPath)) ? await fs.readJson(userSettingsPath) : {};
            localConfig.banner = bannerFileName;
            localConfig.lastUpdate = Date.now();

            await fs.writeJson(userSettingsPath, localConfig, { spaces: 2 });
            const socketName = localConfig.shortName || config.botName;

            await conn.sendMessage(from, { 
                text: `*${config.visuals.emoji3} \`BANNER ACTUALIZADO\` ${config.visuals.emoji3}*\n\nSe ha guardado el banner localmente para *${socketName}*.\n\n*📂 Archivo:* ${bannerFileName}` 
            }, { quoted: m });
        } catch (e) {
            await conn.sendMessage(m.chat, { text: `*${config.visuals.emoji2}* Error al procesar el banner local.` }, { quoted: m });
        }
    }
};

export default setBanner;
