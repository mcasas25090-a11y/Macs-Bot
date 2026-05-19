import { database } from '../database.js';

const balanceCommand = {
    name: 'balance',
    alias: ['bal', 'wallet', 'banco', 'coins'],
    category: 'economy',
    desc: 'Muestra tu balance actual de coins.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            let who;
            if (m.quoted && m.quoted.sender) {
                who = m.quoted.sender;
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                who = m.mentionedJid[0];
            } else {
                who = m.sender;
            }

            let user = global.db.data.users[who];
            if (!user) {
                user = await database.getUser(who);
            }

            if (!user) {
                user = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z' };
                global.db.data.users[who] = user;
                await database.saveUser(who, user);
            }

            const wallet = user.wallet || 0;
            const bank = user.bank || 0;
            const total = wallet + bank;

            let txt = `*❁ \`BALANCE DE CUENTA\` ❁*\n\n`;
            txt += `» *Usuario:* @${who.split('@')[0]}\n`;
            txt += `*❀ Billetera »* $${wallet.toLocaleString()} coins\n`;
            txt += `*✿ Banco »* $${bank.toLocaleString()} coins\n`;
            txt += `*✰ Total Neto »* $${total.toLocaleString()} coins\n\n`;
            txt += `> ¡Sigue sumando coins para dominar la economía!`;

            return conn.sendMessage(m.chat, { text: txt, mentions: [who] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default balanceCommand;