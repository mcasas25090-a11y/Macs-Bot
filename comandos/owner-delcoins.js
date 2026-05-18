import { config } from '../config.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario de su cartera y banco.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, args) => {
        try {
            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwnerNumber) {
                return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\`\n\nEste comando solo puede ser ejecutado por mi creador.`);
            }

            let rawTarget = m.quoted ? m.quoted.sender || m.quoted.key.participant || m.quoted.key.remoteJid : m.mentionedJid?.[0];

            if (!rawTarget) {
                return m.reply(`*${config.visuals.emoji2}* \`Usuario Requerido\`\n\nMenciona a alguien o responde a su mensaje.`);
            }

            const targetJid = rawTarget.replace(/:.*@/g, '@');
            const userDb = global.db.data.users[targetJid];
            const userId = targetJid.split('@')[0];

            if (!userDb || ((userDb.wallet || 0) + (userDb.bank || 0)) <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`Usuario Sin Fondos\`\n\n@${userId} no tiene dinero para confiscar.`, { mentions: [targetJid] });
            }

            const isAll = args.some(arg => arg.toLowerCase() === 'all' || arg.toLowerCase() === 'todo');
            const montoInput = parseInt(args.find(arg => !isNaN(arg) && !arg.includes('@')));

            if (!isAll && (!montoInput || montoInput <= 0)) {
                return m.reply(`*${config.visuals.emoji2}* \`Monto Inválido\`\n\nIngresa una cantidad o usa *all*.`);
            }

            let wallet = userDb.wallet || 0;
            let bank = userDb.bank || 0;
            let totalDisponible = wallet + bank;
            let retiradoReal = 0;

            if (isAll) {
                retiradoReal = totalDisponible;
                userDb.wallet = 0;
                userDb.bank = 0;
            } else {
                retiradoReal = Math.min(totalDisponible, montoInput);
                let restante = retiradoReal;

                if (userDb.wallet >= restante) {
                    userDb.wallet -= restante;
                } else {
                    restante -= (userDb.wallet || 0);
                    userDb.wallet = 0;
                    userDb.bank = Math.max(0, (userDb.bank || 0) - restante);
                }
            }

            const texto = `*${config.visuals.emoji3}* \`SANCIÓN ECONÓMICA\` *${config.visuals.emoji3}*\n\n*❁ Usuario:* @${userId}\n*❁ Monto Retirado:* \`¥${retiradoReal.toLocaleString()}\` ${isAll ? '*(TODO)*' : ''}\n\n*${config.visuals.emoji} Cartera:* ¥${(userDb.wallet || 0).toLocaleString()}\n*${config.visuals.emoji4} Banco:* ¥${(userDb.bank || 0).toLocaleString()}\n\n> Los fondos han sido confiscados correctamente.`;

            await conn.sendMessage(m.chat, { 
                text: texto, 
                mentions: [targetJid] 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error interno al procesar la sanción.`);
        }
    }
};

export default removeCoins;