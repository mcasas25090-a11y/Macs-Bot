import { config } from '../config.js';
import { yts, youtube } from 'btch-downloader';

const youtubeAudio = {
    name: 'play',
    alias: ['audio', 'yta'],
    category: 'descargas',
    desc: 'Busca, muestra info y descarga el audio de YouTube.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        if (!text) return m.reply(`*${config.visuals.emoji2}* Por favor, ingresa el nombre de la canción o video.`);

        await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        try {
            let videoUrl;
            const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(text);

            if (isUrl) {
                videoUrl = text;
                await m.reply(`*${config.visuals.emoji3}* Enlace detectado. Enviando audio, espera un momento...`);
            } else {
                const searchRes = await yts(text);
                const results = searchRes?.data || searchRes?.videos || searchRes;

                if (!results || results.length === 0) {
                    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply('No se encontraron resultados.');
                }

                const firstResult = results[0];
                videoUrl = firstResult.url || firstResult.link || `https://youtu.be/${firstResult.videoId}`;

                const durationStr = firstResult.duration?.timestamp || firstResult.duration || '0:00';
                const parts = String(durationStr).split(':').map(Number);
                let totalMinutes = 0;
                if (parts.length === 3) totalMinutes = (parts[0] * 60) + parts[1];
                else if (parts.length === 2) totalMinutes = parts[0];

                if (totalMinutes >= 45) {
                    await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
                    return m.reply(`*${config.visuals.emoji2}* El video es demasiado largo. El límite permitido es de 45 minutos.`);
                }

                const infoText = `*${config.visuals.emoji3} YouTube Play ${config.visuals.emoji3}*\n\n` +
                                 `*= Título* »\n> ${firstResult.title}\n` +
                                 `*= Canal* »\n> ${firstResult.author?.name || firstResult.channel || 'Desconocido'}\n` +
                                 `*= Duración* »\n> ${durationStr}\n` +
                                 `*= Vistas* »\n> ${firstResult.views || 'N/A'}\n` +
                                 `*= Enlace* »\n> ${videoUrl}\n\n` +
                                 `_Enviando audio, espera un momento..._`;

                const thumbnail = firstResult.thumbnail || firstResult.image;
                if (thumbnail) {
                    await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoText }, { quoted: m });
                } else {
                    await m.reply(infoText);
                }
            }

            const audioRes = await youtube(videoUrl);
            const audioData = Array.isArray(audioRes) ? audioRes[0] : audioRes;

            const downloadUrl = audioData?.mp3 || audioData?.audio || audioData?.download_url || audioData?.url;
            const title = audioData?.title || 'audio';

            if (!downloadUrl) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('Error al obtener el audio.');
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

export default youtubeAudio;