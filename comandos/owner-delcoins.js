import { config } from '../config.js';
import { database } from '../database.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario de su cartera y banco de forma exacta o total.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, args) => {
        try {
            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwnerNumber) {
                return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\`\n\nEste comando solo puede ser ejecutado por mi creador.`);
            }

            let who;
            if (m.quoted && m.quoted.sender) {
                who = m.quoted.sender;
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                who = m.mentionedJid[0];
            }

            if (!who) {
                return m.reply(`*${config.visuals.emoji2}* \`Usuario Requerido\`\n\nMenciona a alguien o responde a su mensaje.`);
            }

            let victim = global.db.data.users[who];
            if (!victim) {
                victim = await database.getUser(who);
            }

            if (!victim) {
                victim = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z' };
            }

            let wallet = victim.wallet || 0;
            let bank = victim.bank || 0;
            let totalDisponible = wallet + bank;
            const userId = who.split('@')[0];

            if (totalDisponible <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`Usuario Sin Fondos\`\n\n@${userId} no tiene dinero en efectivo ni en el banco para confiscar.`, { mentions: [who] });
            }

            const amountArg = args.find(arg => !arg.includes('@'));
            if (!amountArg) {
                return m.reply(`*${config.visuals.emoji2}* Especifica la cantidad o usa la palabra *all*.`);
            }

            const isAll = amountArg.toLowerCase() === 'all' || amountArg.toLowerCase() === 'todo';
            let montoInput = parseInt(amountArg.replace(/[^0-9]/g, ''));

            if (!isAll && (isNaN(montoInput) || montoInput <= 0)) {
                return m.reply(`*${config.visuals.emoji2}* \`Monto Inválido\`\n\nIngresa una cantidad numérica o usa *all*.`);
            }

            let retiradoReal = 0;

            if (isAll) {
                retiradoReal = totalDisponible;
                victim.wallet = 0;
                victim.bank = 0;
            } else {
                retiradoReal = Math.min(totalDisponible, montoInput);
                let restante = retiradoReal;

                if (wallet >= restante) {
                    victim.wallet = wallet - restante;
                } else {
                    restante -= wallet;
                    victim.wallet = 0;
                    victim.bank = Math.max(0, bank - restante);
                }
            }

            global.db.data.users[who] = victim;
            await database.saveUser(who, victim);

            const texto = `*${config.visuals.emoji3}* \`SANCIÓN ECONÓMICA\` *${config.visuals.emoji3}*\n\n*❁ Autoridad:* @${senderNumber}\n*❁ Usuario Sancionado:* @${userId}\n*❁ Monto Confiscado:* \`¥${retiradoReal.toLocaleString()}\` ${isAll ? '*(TOTAL)*' : ''}\n\n*${config.visuals.emoji} Cartera Restante:* ¥${(victim.wallet || 0).toLocaleString()}\n*${config.visuals.emoji4} Banco Restante:* ¥${(victim.bank || 0).toLocaleString()}\n\n> Los fondos del balance global han sido actualizados con éxito.`;

            await conn.sendMessage(m.chat, { 
                text: texto, 
                mentions: [who] 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error interno al procesar la sanción.`);
        }
    }
};

export default removeCoins;