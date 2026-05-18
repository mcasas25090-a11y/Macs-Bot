import { config } from '../config.js';
import { database } from '../database.js';

const removeCoins = {
    name: 'removecoins',
    alias: ['quitarcoins', 'delcoins', 'removerdinero'],
    category: 'owner',
    desc: 'Confisca monedas de un usuario.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, { args, text }) => {
        try {
            const realOwner = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            if (m.sender.split('@')[0].replace(/\D/g, '') !== realOwner) return m.reply("Solo mi creador usa esto.");

            let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid.length > 0 ? m.mentionedJid[0] : null);
            
            if (!target && text) {
                const match = text.match(/\d+/);
                if (match) target = match[0] + '@s.whatsapp.net';
            }

            if (!target) return m.reply(`*${config.visuals.emoji2}* Responde a alguien o menciónalo.`);

            let userDb = await database.getUser(target);
            if (!userDb) return m.reply("Usuario no registrado.");

            let total = Number(userDb.wallet || 0) + Number(userDb.bank || 0);
            let input = text || "";
            let amount = input.toLowerCase().includes('all') ? total : parseInt(input.replace(/[^0-9]/g, ''));

            if (isNaN(amount) || amount <= 0) return m.reply("Especifica un monto válido.");

            let aQuitar = Math.min(total, amount);
            let restante = aQuitar;

            let w = Number(userDb.wallet || 0);
            if (w >= restante) {
                userDb.wallet = w - restante;
            } else {
                restante -= w;
                userDb.wallet = 0;
                userDb.bank = Math.max(0, Number(userDb.bank || 0) - restante);
            }

            await database.saveUser(target, userDb);
            m.reply(`*${config.visuals.emoji3}* Se han confiscado ¥${aQuitar.toLocaleString()} de @${target.split('@')[0]}`, { mentions: [target] });
        } catch (e) {
            console.error(e);
            m.reply("Error crítico al remover monedas.");
        }
    }
};
export default removeCoins;
