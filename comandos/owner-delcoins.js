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
            // 1. Verificación de Creador (Owner)
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
            if (!userDb) userDb = { jid: targetJid, wallet: '0', bank: '0' };

            // Usamos BigInt para que no se pierda ni un centavo con números gigantes
            let wallet = BigInt(String(userDb.wallet || '0').replace(/\D/g, '') || '0');
            let bank = BigInt(String(userDb.bank || '0').replace(/\D/g, '') || '0');
            let total = wallet + bank;

            // 4. Detectar Monto
            let msg = (text || m.body || "").toLowerCase();
            let amount;

            if (msg.includes('all') || msg.includes('todo')) {
                amount = total;
            } else {
                let num = msg.replace(/[^0-9]/g, '');
                if (!num) return m.reply("Especifica cuánto quitar. Ej: #delcoins 100");
                amount = BigInt(num);
            }

            if (total <= 0n) return m.reply("El usuario no tiene dinero.");

            // 5. Aplicar la quita
            let aQuitar = amount > total ? total : amount;
            let restante = aQuitar;

            if (wallet >= restante) {
                wallet -= restante;
            } else {
                restante -= wallet;
                wallet = 0n;
                bank = bank > restante ? bank - restante : 0n;
            }

            // 6. Guardar como STRING para la DB
            userDb.wallet = wallet.toString();
            userDb.bank = bank.toString();

            await database.saveUser(targetJid, userDb);

            m.reply(`*${config.visuals.emoji3}* Confiscado: ¥${aQuitar.toLocaleString()}\n*Usuario:* @${userId}`, { mentions: [targetJid] });

        } catch (e) {
            console.error(e);
            m.reply("Error: Asegúrate de haber corrido el comando de Termux del PASO 1.");
        }
    }
};

export default removeCoins;
