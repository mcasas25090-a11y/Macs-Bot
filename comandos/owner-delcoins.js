import { config } from '../config.js';
import { database } from '../database.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario de su cartera y banco.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, { args, text }) => {
        try {
            // 1. Verificación de Creador (Owner)
            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwnerNumber) {
                return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\`\n\nSolo mi creador puede usar este comando.`);
            }

            // 2. Identificar al objetivo (Respuesta > Mención > Texto)
            let rawTarget = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);
            
            // Si no hay mención ni respuesta, buscamos un número de teléfono en el texto
            if (!rawTarget && args[0] && args[0].includes('@')) {
                rawTarget = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }

            if (!rawTarget) {
                return m.reply(`*${config.visuals.emoji2}* \`USUARIO REQUERIDO\`\n\nDebes responder a un mensaje o mencionar a alguien.\n*Ejemplo:* #delcoins @usuario 5000`);
            }

            const targetJid = rawTarget.replace(/:.*@/g, '@');
            const userId = targetJid.split('@')[0];

            // 3. Obtener datos de la DB
            let userDb = await database.getUser(targetJid);
            if (!userDb) {
                return m.reply(`*${config.visuals.emoji2}* El usuario no está registrado en el sistema.`);
            }

            // 4. Limpiar y convertir el dinero (Maneja números gigantes del error previo)
            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);
            let totalDisponible = wallet + bank;

            if (totalDisponible <= 0) {
                return m.reply(`*${config.visuals.emoji2}* @${userId} no tiene fondos para retirar.`, { mentions: [targetJid] });
            }

            // 5. Procesar el monto a retirar
            const isAll = text.toLowerCase().includes('all') || text.toLowerCase().includes('todo');
            // Buscamos el primer número puro en los argumentos
            const montoInput = parseInt(text.replace(/[^0-9]/g, ''));

            if (!isAll && (isNaN(montoInput) || montoInput <= 0)) {
                return m.reply(`*${config.visuals.emoji2}* \`MONTO INVÁLIDO\`\n\nEspecifica una cantidad o usa *all*.\n*Ejemplo:* #delcoins @usuario 1000`);
            }

            let retiradoReal = 0;

            if (isAll) {
                retiradoReal = totalDisponible;
                userDb.wallet = 0;
                userDb.bank = 0;
            } else {
                retiradoReal = Math.min(totalDisponible, montoInput);
                let restante = retiradoReal;

                // Restar primero de Cartera, luego de Banco
                if (wallet >= restante) {
                    userDb.wallet = wallet - restante;
                } else {
                    restante -= wallet;
                    userDb.wallet = 0;
                    userDb.bank = Math.max(0, bank - restante);
                }
            }

            // 6. Guardar cambios en PostgreSQL
            await database.saveUser(targetJid, userDb);

            const textoMsg = `*${config.visuals.emoji3}* \`SANCIÓN APLICADA\` *${config.visuals.emoji3}*\n\n` +
                `*❁ Usuario:* @${userId}\n` +
                `*❁ Confiscado:* \`¥${retiradoReal.toLocaleString()}\` ${isAll ? '*(TOTAL)*' : ''}\n\n` +
                `*${config.visuals.emoji} Cartera:* ¥${Number(userDb.wallet).toLocaleString()}\n` +
                `*${config.visuals.emoji4} Banco:* ¥${Number(userDb.bank).toLocaleString()}\n\n` +
                `> Acción ejecutada por el Administrador.`;

            await conn.sendMessage(m.chat, { text: textoMsg, mentions: [targetJid] }, { quoted: m });

        } catch (e) {
            console.error("ERROR CRÍTICO EN REMOVECOINS:", e);
            m.reply(`*${config.visuals.emoji2}* Error interno al procesar la base de datos.`);
        }
    }
};

export default removeCoins;
