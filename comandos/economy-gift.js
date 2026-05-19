import { database } from '../database.js';

const giftCommand = {
    name: 'gift',
    alias: ['regalar', 'dar', 'enviar'],
    category: 'economy',
    desc: 'Regala coins en efectivo desde tu billetera a la de otro usuario.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            let who;
            if (m.quoted && m.quoted.sender) {
                who = m.quoted.sender;
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                who = m.mentionedJid[0];
            }

            if (!who) {
                return m.reply(`*❁* Debes mencionar a un usuario o responder a su mensaje para darle las coins.\n\n» Ejemplo: *${usedPrefix || ''}${commandName} @user 5000*`);
            }

            if (who === m.sender) {
                return m.reply(`*❁* No puedes regalarte coins a ti mismo.`);
            }

            const amountArg = args.find(arg => !arg.includes('@'));
            if (!amountArg) {
                return m.reply(`*❁* Especifica la cantidad que deseas regalar o escribe *all*.\n\n» Ejemplo: *${usedPrefix || ''}${commandName} @user 5000*`);
            }

            let senderUser = global.db.data.users[m.sender];
            const senderWallet = senderUser.wallet || 0;

            let amount;
            if (amountArg.toLowerCase() === 'all') {
                amount = senderWallet;
            } else {
                amount = parseInt(amountArg.replace(/[^0-9]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*❁* Ingresa una cantidad válida y mayor a cero para regalar.`);
            }

            if (senderWallet < amount) {
                return m.reply(`*❁ \`FONDOS INSUFICIENTES\` ❁*\n\n» No tienes esa cantidad en tu billetera.\n» Dispones de: *$${senderWallet.toLocaleString()}* coins.`);
            }

            let receiverUser = global.db.data.users[who];
            if (!receiverUser) {
                receiverUser = await database.getUser(who);
            }

            if (!receiverUser) {
                receiverUser = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z' };
            }

            senderUser.wallet = senderWallet - amount;
            receiverUser.wallet = (receiverUser.wallet || 0) + amount;

            global.db.data.users[m.sender] = senderUser;
            global.db.data.users[who] = receiverUser;

            await database.saveUser(m.sender, senderUser);
            await database.saveUser(who, receiverUser);

            let txt = `*❁ \`ENVÍO DE EFECTIVO\` ❁*\n\n`;
            txt += `» Has entregado coins en mano de manera directa.\n`;
            txt += `*❀ De »* @${m.sender.split('@')[0]}\n`;
            txt += `*✿ Para »* @${who.split('@')[0]}\n`;
            txt += `*✰ Monto Entregado »* $${amount.toLocaleString()} coins\n\n`;
            txt += `> ✿ Las coins han sido agregadas a su billetera actual.`;

            return conn.sendMessage(m.chat, { text: txt, mentions: [m.sender, who] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default giftCommand;