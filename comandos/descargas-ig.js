import { config } from '../config.js';
import { igdl } from 'btch-downloader';

const instagramDownload = {
    name: 'instagram',
    alias: ['ig', 'igdl'],
    category: 'descargas',
    desc: 'Descarga videos o fotos de Instagram.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        const urlMatch = text?.match(/https?:\/\/[^\s]+/gi);
        const link = urlMatch ? urlMatch[0] : null;

        if (!link) return m.reply(`*${config.visuals.emoji2}* Por favor, proporciona un enlace para procesar la descarga.`);

        if (!link.includes('instagram.com')) {
            return m.reply(`*${config.visuals.emoji2}* El enlace proporcionado no pertenece a Instagram. Por favor, verifica la URL.`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        try {
            const res = await igdl(link);
            const items = Array.isArray(res) ? res : res?.data;

            if (!items || items.length === 0) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('No se pudo encontrar contenido en este enlace.');
            }

            const mediaUrl = items[0].url || items[0].download_url || items[0].link;

            if (!mediaUrl) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('No se pudo extraer la URL del contenido.');
            }

            const caption = `*${config.visuals.emoji3} Instagram Downloader*`;

            await conn.sendMessage(m.chat, { video: { url: mediaUrl }, caption: caption }, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Error: ${e.message}`);
        }
    }
};

export default instagramDownload;