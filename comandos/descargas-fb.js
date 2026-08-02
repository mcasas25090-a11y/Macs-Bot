import { config } from '../config.js';
import { fbdown } from 'btch-downloader';

const fbDownload = {
    name: 'facebook',
    alias: ['fb', 'fbdl'],
    category: 'descargas',
    desc: 'Descarga videos de Facebook.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        const urlMatch = text?.match(/https?:\/\/[^\s]+/gi);
        const link = urlMatch ? urlMatch[0] : null;

        if (!link) return m.reply(`*${config.visuals.emoji2}* Por favor, ingresa el enlace del video de Facebook que deseas descargar.`);

        if (!link.includes('facebook.com') && !link.includes('fb.watch')) {
            return m.reply(`*${config.visuals.emoji2}* El enlace no parece ser de Facebook. Asegúrate de copiar la URL correctamente.`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        try {
            const res = await fbdown(link);

            const videoUrl = res?.HD || res?.hd || res?.SD || res?.sd || res?.url;

            if (!videoUrl) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('No se pudo obtener el video. Verifica que el enlace sea público.');
            }

            const title = res?.title || 'Video de Facebook';
            const caption = `*${config.visuals.emoji3} Facebook Downloader*\n\n📝 ${title}`;

            await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption: caption }, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Error: ${e.message}`);
        }
    }
};

export default fbDownload;