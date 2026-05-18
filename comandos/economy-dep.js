import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins.',
    noPrefix: true,

    run: async (conn, m, { text, args }) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);
            if (!userDb) userDb = { wallet: 0, bank: 0 };

            let wallet = Number(userDb.wallet || 0);
            if (wallet <= 0) return m.reply("Tu cartera está vacía.");

            // BUSCADOR RADICAL DE TEXTO
            // Intentamos todas las formas posibles en las que el bot guarda el mensaje
            let msgRaw = text || 
                         (args && args.join(' ')) || 
                         m.body || 
                         m.text || 
                         (m.message && m.message.conversation) || 
                         (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.text) || 
                         "";

            let lowerMsg = msgRaw.toLowerCase().trim();
            let amount = 0;

            if (lowerMsg.includes('all') || lowerMsg.includes('todo')) {
                amount = wallet;
            } else {
                let extract = lowerMsg.replace(/[^0-9]/g, '');
                amount = parseInt(extract);
            }

            if (!amount || isNaN(amount) || amount <= 0) {
                // Si esto vuelve a salir vacío, el problema está en cómo pixel.js pasa el objeto 'm'
                return m.reply(`*⚠️ DATOS NO DETECTADOS*\n\nIntenta escribir el monto después del comando.\nEjemplo: *#d 100*`);
            }

            if (amount > wallet) return m.reply("No tienes tanto dinero.");

            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            await database.saveUser(userJid, userDb);
            m.reply(`✅ Depositaste ¥${amount.toLocaleString()} al banco.`);

        } catch (e) {
            console.error(e);
            m.reply("Error en la base de datos.");
        }
    }
};

export default depCommand;
