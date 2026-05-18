import { config } from '../config.js';
import { database } from '../database.js';
import { workFrases } from './frases/work.js';

const workCommand = {
    name: 'work',
    alias: ['chamba', 'trabajar', 'w'],
    category: 'economy',
    desc: 'Realiza trabajos honrados para ganar coins.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m) => {
        try {
            const userJid = m.sender;
            const ahora = Date.now();
            const cooldown = 5 * 60 * 1000;

            let userDb = await database.getUser(userJid);
            if (!userDb) {
                userDb = { 
                    wallet: 0, 
                    bank: 0, 
                    genre: 'No definido', 
                    marry: null, 
                    last_claim: new Date(0).toISOString(),
                    lastWork: 0 
                };
            }

            const tiempoPasado = ahora - (Number(userDb.lastWork) || 0);

            if (tiempoPasado < cooldown) {
                const restante = cooldown - tiempoPasado;
                const minutos = Math.floor(restante / 60000);
                const segundos = Math.floor((restante % 60000) / 1000);

                let tiempoTexto = minutos > 0 ? `${minutos}m ${segundos}s` : `${segundos}s`;
                return m.reply(`*${config.visuals.emoji2}* \`DESCANSO\`\n\n> Debes esperar **${tiempoTexto}** para volver a chambear.`);
            }

            const recompensa = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
            const frase = workFrases[Math.floor(Math.random() * workFrases.length)];

            userDb.wallet = Number(userDb.wallet || 0) + recompensa;
            userDb.lastWork = ahora;

            let texto = `*${config.visuals.emoji3}* \`CHAMBA EXITOSA\` *${config.visuals.emoji3}*\n\n`;
            texto += `${frase}\n`;
            texto += `*${config.visuals.emoji} Ganaste:* ¥${recompensa.toLocaleString()}\n\n`;
            texto += `> *Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await database.saveUser(userJid, userDb);
            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar la chamba.`);
        }
    }
};

export default workCommand;