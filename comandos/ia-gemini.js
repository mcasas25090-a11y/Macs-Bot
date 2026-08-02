import { config } from '../config.js';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const aiGemini = {
    name: 'kazuma',
    alias: ['ai', 'ia', 'gemini'],
    category: 'ia',
    desc: 'Habla con la IA o busca imágenes.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        if (!text) return m.reply(`*${config.visuals.emoji2}* Hola ${m.pushName}, ¿qué necesitas?`);

        const isImageRequest = /genera|dibuja|imagen|foto|search|buscame/i.test(text);

        if (isImageRequest) {
            await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const search = text.replace(/(Macs|ai|ia|gemini|genera|dibuja|buscame|search|una|un|de|la|el|imagen|foto)/gi, '').trim();
            const query = search || text;

            try {
                const response = await axios.get('https://api.unsplash.com/search/photos', {
                    params: { query, per_page: 1 },
                    headers: { Authorization: `Client-ID ${config.unsplashApiKey}` }
                });

                const results = response.data?.results;

                if (!results || results.length === 0) {
                    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply('No pude encontrar una imagen para esa solicitud.');
                }

                const imageUrl = results[0].urls.regular;
                await conn.sendMessage(m.chat, {
                    image: { url: imageUrl },
                    caption: `*${config.visuals.emoji3} Búsqueda de Imágenes*\n\n✨ Aquí tienes una imagen sobre: *${query}*`
                }, { quoted: m });

                await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            } catch (e) {
                await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
                m.reply(`*${config.visuals.emoji2}* Error buscando la imagen.`);
            }

            return;
        }

        await conn.sendMessage(m.chat, { react: { text: '🧠', key: m.key } });
        const { key } = await m.reply('*⌛* Procesando respuesta, espera un momento...');

        const prompt = `Actúa como Macs, el asistente inteligente de este bot. Tu personalidad es alegre, servicial y muy entusiasta. Debes ser amigable con ${m.pushName} y demostrar mucha energía en cada respuesta. IMPORTANTE: No utilices emojis en tus respuestas bajo ninguna circunstancia. Para resaltar texto en negrita utiliza únicamente UN solo asterisco, por ejemplo: *así*. No utilices doble asterisco bajo ninguna circunstancia. Responde de forma creativa a lo siguiente: `;

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt + text);
            const responseText = result.response.text();

            if (!responseText) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return conn.sendMessage(m.chat, { text: 'La IA no devolvió una respuesta válida.', edit: key });
            }

            await conn.sendMessage(m.chat, { text: responseText, edit: key });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            const errorMsg = `*${config.visuals.emoji2}* Error: ${e.message}`;
            await conn.sendMessage(m.chat, { text: errorMsg, edit: key });
        }
    }
};

export default aiGemini;