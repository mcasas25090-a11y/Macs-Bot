import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas al banco.',
    noPrefix: true,

    run: async (conn, m, { text }) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);
            if (!userDb) userDb = { wallet: 0, bank: 0 };

            let wallet = Number(userDb.wallet || 0);
            if (wallet <= 0) return m.reply(`*${config.visuals.emoji2}* Cartera vacía.`);

            // LEER DIRECTAMENTE DEL MENSAJE ORIGINAL
            // m.text suele traer el mensaje completo, ej: "#d all"
            let msg = (m.text || m.body || text || "").toLowerCase();
            
            let amount;
            if (msg.includes('all') || msg.includes('todo')) {
                amount = wallet;
            } else {
                // Extraer solo los números del mensaje
                let extract = msg.replace(/[^0-9]/g, '');
                amount = parseInt(extract);
            }

            if (!amount || isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nUsa: #d [monto] o #d all`);
            }

            if (amount > wallet) return m.reply(`*${config.visuals.emoji2}* No tienes suficiente dinero.`);

            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            await database.saveUser(userJid, userDb);

            let res = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\`\n\n`;
            res += `*Monto:* ¥${amount.toLocaleString()}\n`;
            res += `*Banco:* ¥${userDb.bank.toLocaleString()}`;
            
            await conn.sendMessage(m.chat, { text: res }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply("Error en la DB.");
        }
    }
};
export default depCommand;
