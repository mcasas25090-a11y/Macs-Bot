import { config } from '../config.js';
import { database } from '../database.js';

const addCoins = {
    name: 'addcoins',
    alias: ['darcoins', 'regalarcoins', 'givemoney'],
    category: 'owner',
    desc: 'Suma monedas directamente al banco de un usuario de forma infinita.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, args) => {
        try {
            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwnerNumber) {
                return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\` *${config.visuals.emoji2}*\n\nEste comando solo puede ser ejecutado por mi creador o personas autorizadas.`);
            }

            let who;
            if (m.quoted && m.quoted.sender) {
                who = m.quoted.sender;
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                who = m.mentionedJid[0];
            }

            if (!who) {
                return m.reply(`*${config.visuals.emoji2}* \`Falta Usuario\` *${config.visuals.emoji2}*\n\nMenciona a alguien o responde a su mensaje.`);
            }

            const amountArg = args.find(arg => !arg.includes('@'));
            if (!amountArg) {
                return m.reply(`*${config.visuals.emoji2}* Especifica la cantidad que deseas inyectar al banco.`);
            }

            const monto = parseInt(amountArg.replace(/[^0-9]/g, ''));
            if (isNaN(monto) || monto <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Ingresa una cantidad numérica válida.`);
            }

            let receiverUser = global.db.data.users[who];
            if (!receiverUser) {
                receiverUser = await database.getUser(who);
            }

            if (!receiverUser) {
                receiverUser = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z' };
            }

            receiverUser.bank = (receiverUser.bank || 0) + monto;
            global.db.data.users[who] = receiverUser;
            await database.saveUser(who, receiverUser);

            const userId = who.split('@')[0];

            const texto = `*${config.visuals.emoji3}* \`MONEDAS ENVIADAS\` *${config.visuals.emoji3}*\n\n*❁ Admin/Creador:* @${senderNumber}\n*❁ Usuario:* @${userId}\n*❁ Cantidad:* \`¥${monto.toLocaleString()}\`\n*❁ Destino:* \`Banco\`\n\n> El dinero ha sido sumado con éxito a la cuenta global del usuario.`;

            await conn.sendMessage(m.chat, { 
                text: texto, 
                mentions: [who] 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error interno.`);
        }
    }
};

export default addCoins;