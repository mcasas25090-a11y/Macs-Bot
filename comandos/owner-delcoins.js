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
            // 1. Verificación de Owner
            const realOwner = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            if (m.sender.split('@')[0].replace(/\D/g, '') !== realOwner) return m.reply("Solo mi creador usa esto.");

            // 2. BUSCADOR RADICAL DE TEXTO (Igual al que funcionó en Deposit)
            let msgRaw = text || m.body || m.text || "";
            let lowerMsg = msgRaw.toLowerCase().trim();

            // 3. IDENTIFICAR OBJETIVO
            // Prioridad: Respuesta > Mención > El que envía el comando (tú)
            let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender);
            
            const targetJid = target.replace(/:.*@/g, '@');
            const userId = targetJid.split('@')[0];

            let userDb = await database.getUser(targetJid);
            if (!userDb) return m.reply("El usuario no está en la base de datos.");

            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);
            let total = wallet + bank;

            if (total <= 0) return m.reply(`@${userId} ya no tiene dinero.`, { mentions: [targetJid] });

            // 4. DETECTAR MONTO
            let amount = 0;
            if (lowerMsg.includes('all') || lowerMsg.includes('todo')) {
                amount = total;
            } else {
                let extract = lowerMsg.replace(/[^0-9]/g, '');
                amount = parseInt(extract);
            }

            if (!amount || isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Especifica cuánto quitar.\nEjemplo: *#delcoins 100*`);
            }

            // 5. EJECUTAR QUITA
            let aQuitar = Math.min(total, amount);
            let restante = aQuitar;

            if (wallet >= restante) {
                userDb.wallet = wallet - restante;
            } else {
                restante -= wallet;
                userDb.wallet = 0;
                userDb.bank = Math.max(0, bank - restante);
            }

            await database.saveUser(targetJid, userDb);
            
            m.reply(`*${config.visuals.emoji3}* Confiscado: ¥${aQuitar.toLocaleString()}\n*Usuario:* @${userId}`, { mentions: [targetJid] });

        } catch (e) {
            console.error(e);
            m.reply("Error al procesar la sanción.");
        }
    }
};

export default removeCoins;
