import { config } from '../config.js';
import { database } from '../database.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario de su cartera y banco.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, { args }) => {
        try {
            // 1. Verificación de Creador (Owner)
            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwnerNumber) {
                return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\`\n\nEste comando solo puede ser ejecutado por mi creador.`);
            }

            // 2. Identificar al objetivo
            let rawTarget = m.quoted ? m.quoted.sender : m.mentionedJid?.[0];

            if (!rawTarget) {
                return m.reply(`*${config.visuals.emoji2}* \`Usuario Requerido\`\n\nMenciona a alguien o responde a su mensaje.`);
            }

            const targetJid = rawTarget.replace(/:.*@/g, '@');
            const userId = targetJid.split('@')[0];

            // 3. Obtener datos de PostgreSQL
            let userDb = await database.getUser(targetJid);
            if (!userDb) {
                return m.reply(`*${config.visuals.emoji2}* El usuario no está registrado en la base de datos.`);
            }

            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);
            let totalDisponible = wallet + bank;

            if (totalDisponible <= 0) {
                return m.reply(`*${config.visuals.emoji2}* @${userId} ya no tiene dinero que quitar.`, { mentions: [targetJid] });
            }

            // 4. Procesar cantidad
            const isAll = args.some(arg => arg.toLowerCase() === 'all' || arg.toLowerCase() === 'todo');
            const montoInput = parseInt(args.find(arg => !isNaN(arg) && !arg.includes('@')));

            if (!isAll && (!montoInput || montoInput <= 0)) {
                return m.reply(`*${config.visuals.emoji2}* \`Monto Inválido\`\n\nIngresa una cantidad o usa *all*.`);
            }

            let retiradoReal = 0;

            if (isAll) {
                retiradoReal = totalDisponible;
                userDb.wallet = 0;
                userDb.bank = 0;
            } else {
                retiradoReal = Math.min(totalDisponible, montoInput);
                let restante = retiradoReal;

                // Primero quitamos de cartera, si falta, quitamos de banco
                if (wallet >= restante) {
                    userDb.wallet = wallet - restante;
                } else {
                    restante -= wallet;
                    userDb.wallet = 0;
                    userDb.bank = Math.max(0, bank - restante);
                }
            }

            // 5. Guardar cambios en PostgreSQL
            await database.saveUser(targetJid, userDb);

            const texto = `*${config.visuals.emoji3}* \`SANCIÓN ECONÓMICA\` *${config.visuals.emoji3}*\n\n*❁ Usuario:* @${userId}\n*❁ Monto Retirado:* \`¥${retiradoReal.toLocaleString()}\` ${isAll ? '*(TODO)*' : ''}\n\n*${config.visuals.emoji} Cartera:* ¥${Number(userDb.wallet).toLocaleString()}\n*${config.visuals.emoji4} Banco:* ¥${Number(userDb.bank).toLocaleString()}\n\n> Los fondos han sido confiscados correctamente.`;

            await conn.sendMessage(m.chat, { text: texto, mentions: [targetJid] }, { quoted: m });

        } catch (e) {
            console.error("ERROR EN REMOVECOINS:", e);
            m.reply(`*${config.visuals.emoji2}* Error al intentar confiscar el dinero.`);
        }
    }
};

export default removeCoins;
