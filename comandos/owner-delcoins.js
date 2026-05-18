import { config } from '../config.js';
import { database } from '../database.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, { text, args }) => {
        try {
            // 1. OBTENER EL JID DEL OWNER DE FORMA SEGURA
            const ownerData = config.owner[0];
            const ownerNumber = (Array.isArray(ownerData) ? ownerData[0] : ownerData).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            // 2. VERIFICACIÓN DE SEGURIDAD
            if (senderNumber !== ownerNumber) {
                return m.reply(`*${config.visuals.emoji2}* Solo mi creador puede usar este comando.`);
            }

            // 3. IDENTIFICAR AL OBJETIVO (Respuesta > Mención > Tú mismo)
            let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender);
            const targetJid = target.replace(/:.*@/g, '@');
            const userId = targetJid.split('@')[0];

            // 4. OBTENER DATOS (Y evitar el error si el usuario no existe)
            let userDb = await database.getUser(targetJid);
            if (!userDb) {
                userDb = { jid: targetJid, wallet: 0, bank: 0 };
            }

            // Convertir a números para evitar errores de "BigInt" o "NaN"
            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);
            let total = wallet + bank;

            // 5. DETECTAR EL MONTO (Buscamos en text, args o m.body)
            let fullText = text || (args && args.join(' ')) || m.body || "";
            let amount = 0;

            if (fullText.toLowerCase().includes('all') || fullText.toLowerCase().includes('todo')) {
                amount = total;
            } else {
                let extracted = fullText.replace(/[^0-9]/g, '');
                amount = parseInt(extracted);
            }

            // 6. VALIDACIONES FINALES
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Escribe una cantidad válida.\n*Ejemplo:* #delcoins 5000`);
            }

            if (total <= 0) {
                return m.reply(`*${config.visuals.emoji2}* El usuario @${userId} no tiene monedas.`, { mentions: [targetJid] });
            }

            // 7. EJECUTAR LA QUITA (Primero Cartera, luego Banco)
            let aQuitar = Math.min(total, amount);
            let pendiente = aQuitar;

            if (wallet >= pendiente) {
                userDb.wallet = wallet - pendiente;
            } else {
                pendiente -= wallet;
                userDb.wallet = 0;
                userDb.bank = Math.max(0, bank - pendiente);
            }

            // 8. GUARDAR EN POSTGRESQL
            await database.saveUser(targetJid, userDb);

            const mensajeExito = `*${config.visuals.emoji3}* \`CONFISCACIÓN EXITOSA\`\n\n` +
                                `*❁ De:* @${userId}\n` +
                                `*❁ Monto:* ¥${aQuitar.toLocaleString()}\n\n` +
                                `> Saldo restante actualizado en la base de datos.`;

            await conn.sendMessage(m.chat, { text: mensajeExito, mentions: [targetJid] }, { quoted: m });

        } catch (e) {
            console.error("ERROR CRITICO EN DELCOINS:", e);
            m.reply(`*${config.visuals.emoji2}* Error interno: Probablemente el número es demasiado grande para la base de datos.`);
        }
    }
};

export default removeCoins;
