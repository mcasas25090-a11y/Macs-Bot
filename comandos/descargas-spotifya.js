import { config } from '../config.js';
import { spotify } from 'btch-downloader';

const spotifyDownload = {
    name: 'spotify',
    alias: ['sp', 'spdls'],
    category: 'descargas',
    desc: 'Descarga música de Spotify mediante enlace.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        const urlMatch = text?.match(/https?:\/\/[^\s]+/gi);
        const link = urlMatch ? urlMatch[0] : null;

        if (!link) return m.reply(`*${config.visuals.emoji2}* Por favor, proporciona un enlace de Spotify.`);

        if (!link.includes('open.spotify.com')) {
            return m.reply(`*${config.visuals.emoji2}* El enlace no parece ser de Spotify. Verifica la URL.`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        try {
            const res = await spotify(link);
            const data = Array.isArray(res) ? res[0] : (res?.data || res);

            const downloadUrl = data?.download || data?.download_url || data?.url;
            const title = data?.title || 'Desconocido';
            const artist = data?.artist || data?.artists || 'Desconocido';
            const thumbnail = data?.image || data?.thumbnail;

            if (!downloadUrl) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('No se pudo obtener el audio de este enlace.');
            }

            const infoText = `*${config.visuals.emoji3} Spotify Download ${config.visuals.emoji3}*\n\n` +
                             `*= Título* »\n> ${title}\n` +
                             `*= Artista* »\n> ${artist}\n` +
                             `*= Enlace* »\n> ${link}\n\n` +
                             `_Enviando audio, espera un momento..._`;

            if (thumbnail) {
                await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoText }, { quoted: m });
            } else {
                await m.reply(infoText);
            }

            await conn.sendMessage(m.chat, {
                audio: { url: downloadUrl },
                mimetype: 'audio/mp4',
                fileName: `${title}.mp3`
            }, { quoted: m });

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Error: ${e.message}`);
        }
    }
};

export default spotifyDownload;