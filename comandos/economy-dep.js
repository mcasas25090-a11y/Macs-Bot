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
            // SEGURIDAD: Verificar que el mensaje y el remitente existen
            if (!m || !m.sender) return;

            const userJid = m.sender;
            let userDb = await database.getUser(userJid);
            if (!userDb) userDb = { wallet: 0, bank: 0 };

            // LÍNEA 21 (CORREGIDA): Usamos "?" para que si algo falla, no crashee el bot
            let wallet = Number(userDb?.wallet || 0);
            
            if (wallet <= 0) return m.reply("No tienes monedas en tu cartera.");

            // Buscar el texto de forma ultra-segura
            let msgRaw = text || (args && args.length > 0 ? args.join(' ') : "") || m.body || "";
            let lowerMsg = msgRaw.toLowerCase().trim();
            let amount = 0;

            if (lowerMsg.includes('all') || lowerMsg.includes('todo')) {
                amount = wallet;
            } else {
                let extract = lowerMsg.replace(/[^0-9]/g, '');
                amount = parseInt(extract);
            }

            if (!amount || isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals?.emoji2 || '⚠️'}* \`FALTAN DATOS\`\n\nUsa: #d [monto] o #d all`);
            }

            if (amount > wallet) return m.reply("No tienes tanto dinero.");

            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            await database.saveUser(userJid, userDb);
            m.reply(`✅ Depositaste ¥${amount.toLocaleString()} al banco.`);

        } catch (e) {
            console.error("Error en Deposit:", e);
            // Esto evita que el bot se apague si hay un error
            if (m && m.reply) m.reply("Ocurrió un error interno, pero no me apagué.");
        }
    }
};

export default depCommand;
