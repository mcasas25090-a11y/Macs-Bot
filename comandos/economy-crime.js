import { config } from '../config.js';
import { database } from '../database.js';
import { crimeFrases } from './frases/crimen.js';

const crimeCommand = {
    name: 'crime',
    alias: ['crimen', 'asaltar'],
    category: 'economy',
    desc: 'MODO PRUEBA: Éxito garantizado y sin cooldown.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);

            if (!userDb) {
                userDb = { 
                    wallet: 0, 
                    bank: 0, 
                    genre: 'No definido', 
                    marry: null, 
                    last_claim: new Date().toISOString() 
                };
            }

            const fr = crimeFrases[Math.floor(Math.random() * crimeFrases.length)];
            const recompensa = Math.floor(Math.random() * (fr.max - fr.min + 1)) + fr.min;

            userDb.wallet = Number(userDb.wallet || 0) + recompensa;
            userDb.last_claim = new Date().toISOString();

            let texto = `*${config.visuals.emoji3}* \`CRIMEN EXITOSO (TEST)\` *${config.visuals.emoji3}*\n\n`;
            texto += `${fr.text}\n`;
            texto += `*${config.visuals.emoji} Ganaste:* ¥${recompensa.toLocaleString()}\n\n`;
            texto += `> *Cartera Actual:* ¥${userDb.wallet.toLocaleString()}`;

            await database.saveUser(userJid, userDb);
            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error en la misión de prueba.`);
        }
    }
};

export default crimeCommand;