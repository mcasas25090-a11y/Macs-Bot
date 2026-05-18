import { config } from '../config.js';
import { database } from '../database.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, { text }) => {
        try {
            // 1. Verificar Owner
            const ownerRaw = config.owner[0] && typeof config.owner[0] === 'object' ? config.owner[0][0] : config.owner[0];
            const realOwner = String(ownerRaw).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwner) return m.reply("Comando exclusivo del dueño.");

            // 2. Identificar Objetivo
            let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender);
            const targetJid = target.replace(/:.*@/g, '@');
            const userId = targetJid.split('@')[0];

            // 3. Obtener Usuario
            let userDb = await database.getUser(targetJid);
            if (!userDb) userDb = { jid: targetJid, wallet: 0, bank: 0 };

            // Asegurarnos de que sean números válidos de JS
            let wallet = Number(String(userDb.wallet).replace(/[^0-9]/g, '') || 0);
            let bank = Number(String(userDb.bank).replace(/[^0-9]/g, '') || 0);
            let total = wallet + bank;

            if (total <= 0) return m.reply(`@${userId} no tiene monedas.`, { mentions: [targetJid] });

            // 4. Leer Monto
            let msg = (text || m.body || m.text || "").toLowerCase();
            let amount = 0;

            if (msg.includes('all') || msg.includes('todo')) {
                amount = total;
            } else {
                let numStr = msg.replace(/[^0-9]/g, '');
                amount = parseInt(numStr);
            }

            if (isNaN(amount) || amount <= 0) return m.reply("Especifica un monto válido. Ej: #delcoins 100");

            // 5. Aplicar la resta
            let aQuitar = Math.min(total, amount);
            let restante = aQuitar;

            if (wallet >= restante) {
                wallet -= restante;
            } else {
                restante -= wallet;
                wallet = 0;
                bank = Math.max(0, bank - restante);
            }

            // 6. Guardar
            userDb.wallet = wallet;
            userDb.bank = bank;

            await database.saveUser(targetJid, userDb);

            m.reply(`*${config.visuals.emoji3}* Confiscado: ¥${aQuitar.toLocaleString()}\n*Usuario:* @${userId}`, { mentions: [targetJid] });

        } catch (e) {
            console.error("ERROR REAL EN DELCOINS:", e);
            // ESTA ES LA LÍNEA MÁGICA: Imprime el error exacto de código en WhatsApp
            m.reply(`*🚨 ERROR DETECTADO:*\n${e.message || e}`);
        }
    }
};

export default removeCoins;
