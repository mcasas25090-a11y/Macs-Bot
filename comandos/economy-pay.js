import { database } from '../database.js';

const payCommand = {
    name: 'pay',
    alias: ['transferir', 'transfer', 'pagar'],
    category: 'economy',
    desc: 'Transfiere coins de tu banco al banco de otro usuario.',
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
                return m.reply(`*❁* Debes mencionar a un usuario o responder a su mensaje para realizar la transferencia.\n\n» Ejemplo: *${usedPrefix || ''}${commandName} @user 5000*`);
            }

            if (who === m.sender) {
                return m.reply(`*❁* No puedes realizar transferencias bancarias a ti mismo.`);
            }

            const amountArg = args.find(arg => !arg.includes('@'));
            if (!amountArg) {
                return m.reply(`*❁* Especifica la cantidad que deseas transferir o escribe *all*.\n\n» Ejemplo: *${usedPrefix || ''}${commandName} @user 5000*`);
            }

            let senderUser = global.db.data.users[m.sender];
            const senderBank = senderUser.bank || 0;

            let amount;
            if (amountArg.toLowerCase() === 'all') {
                amount = senderBank;
            } else {
                amount = parseInt(amountArg.replace(/[^0-9]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*❁* Ingresa una cantidad válida y mayor a cero para transferir.`);
            }

            if (senderBank < amount) {
                return m.reply(`*❁ \`FONDOS INSUFICIENTES\` ❁*\n\n» No tienes esa cantidad en tu banco.\n» Dispones de: *$${senderBank.toLocaleString()}* coins.`);
            }

            let receiverUser = global.db.data.users[who];
            if (!receiverUser) {
                receiverUser = await database.getUser(who);
            }

            if (!receiverUser) {
                receiverUser = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z' };
            }

            senderUser.bank = senderBank - amount;
            receiverUser.bank = (receiverUser.bank || 0) + amount;

            global.db.data.users[m.sender] = senderUser;
            global.db.data.users[who] = receiverUser;

            await database.saveUser(m.sender, senderUser);
            await database.saveUser(who, receiverUser);

            let txt = `*❁ \`TRANSFERENCIA BANCARIA\` ❁*\n\n`;
            txt += `» Transacción procesada por el sistema financiero.\n`;
            txt += `*❀ Emisor »* @${m.sender.split('@')[0]}\n`;
            txt += `*✿ Receptor »* @${who.split('@')[0]}\n`;
            txt += `*✰ Monto Enviado »* $${amount.toLocaleString()} coins\n\n`;
            txt += `> ❀ Fondos depositados directamente en la cuenta bancaria.`;

            return conn.sendMessage(m.chat, { text: txt, mentions: [m.sender, who] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default payCommand;