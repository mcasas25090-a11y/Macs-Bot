import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas de tu cartera al banco.',
    noPrefix: true,

    run: async (conn, m, { args }) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);

            if (!userDb) return m.reply(`*${config.visuals.emoji2}* No tienes una cuenta activa.`);

            const wallet = Number(userDb.wallet || 0);
            if (wallet <= 0) return m.reply(`*${config.visuals.emoji2}* \`CARTERA VACÍA\`\n\nNo tienes dinero para depositar.`);

            let amount = args[0];
            if (!amount) return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nIngresa una cantidad o usa *all*.`);

            if (amount.toLowerCase() === 'all') {
                amount = wallet;
            } else {
                amount = parseInt(amount.replace(/[^0-9]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) return m.reply(`*${config.visuals.emoji2}* Cantidad inválida.`);
            if (wallet < amount) return m.reply(`*${config.visuals.emoji2}* No tienes suficiente dinero en cartera.`);

            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\` *${config.visuals.emoji3}*\n\n`;
            texto += `*${config.visuals.emoji} Monto:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Restante en Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await database.saveUser(userJid, userDb);
            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error en el depósito.`);
        }
    }
};

export default depCommand;