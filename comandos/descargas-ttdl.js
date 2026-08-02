import { config } from '../config.js';
import { ttdl } from 'btch-downloader';

const tiktokDownload = {
    name: 'tiktok',
    alias: ['tt', 'ttdl'],
    category: 'descargas',
    desc: 'Descarga videos de TikTok.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        const urlMatch = text?.match(/https?:\/\/[^\s]+/gi);
        const link = urlMatch ? urlMatch[0] : null;

        if (!link) return m.reply(`*${config.visuals.emoji2}* Ingresa un enlace para descargar el vídeo.`);

        await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        try {
            const res = await ttdl(link);
            const data = Array.isArray(res) ? res[0] : (res?.data || res);

            const videoUrl = data?.video?.[0] || data?.play || data?.no_watermark || data?.video_hd || data?.url;
            const title = data?.title || data?.desc || 'TikTok';
            const author = data?.author?.nickname || data?.author || 'Desconocido';

            if (!videoUrl) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('Video no encontrado.');
            }

            const txt = `*${config.visuals.emoji3} TikTok*\n\n📝 ${title}\n👤 ${author}`;

            await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption: txt }, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Error: ${e.message}`);
        }
    }
};

export default tiktokDownload;