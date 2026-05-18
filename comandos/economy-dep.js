import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas al banco.',
    noPrefix: true,

    run: async (conn, m, { args, text }) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);
            if (!userDb) userDb = { wallet: 0, bank: 0 };

            let wallet = Number(userDb.wallet || 0);
            if (wallet <= 0) return m.reply(`*${config.visuals.emoji2}* No tienes dinero en cartera.`);

            // Detección segura de cantidad
            let input = '';
            if (text) input = text.trim().toLowerCase();
            else if (args && args.length > 0) input = args[0].toLowerCase();

            if (!input) return m.reply(`*${config.visuals.emoji2}* Ingresa una cantidad o usa *all*.`);

            let amount = input.includes('all') ? wallet : parseInt(input.replace(/[^0-9]/g, ''));

            if (isNaN(amount) || amount <= 0) return m.reply(`*${config.visuals.emoji2}* Cantidad inválida.`);
            if (amount > wallet) return m.reply(`*${config.visuals.emoji2}* Solo tienes ¥${wallet.toLocaleString()}.`);

            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            await database.saveUser(userJid, userDb);
            m.reply(`*${config.visuals.emoji3}* Depositaste ¥${amount.toLocaleString()} correctamente.`);
        } catch (e) {
            console.error(e);
            m.reply("Error en la base de datos.");
        }
    }
};
export default depCommand;
