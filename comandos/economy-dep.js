import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas de tu cartera al banco.',
    noPrefix: true,

    run: async (conn, m, { args, text }) => {
        try {
            const userJid = m.sender;
            
            // 1. Obtener datos del usuario
            let userDb = await database.getUser(userJid);
            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', last_claim: new Date(0).toISOString() };
            }

            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);

            // 2. Validación de cartera vacía
            if (wallet <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`CARTERA VACÍA\`\n\nNo tienes dinero para depositar.`);
            }

            // 3. Detectar la cantidad (probamos con args o con el texto directo)
            let input = (args && args[0] ? args[0] : text)?.trim().toLowerCase();
            
            if (!input) {
                return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nIngresa una cantidad o usa *all*.\n*Ejemplo:* #dep 5000`);
            }

            let amount;
            if (input === 'all') {
                amount = wallet;
            } else {
                amount = parseInt(input.replace(/[^0-9]/g, ''));
            }

            // 4. Validar cantidad resultante
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Cantidad inválida. Escribe un número o *all*.`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* \`FONDOS INSUFICIENTES\`\n\nNo puedes depositar **¥${amount.toLocaleString()}** porque solo tienes **¥${wallet.toLocaleString()}**.`);
            }

            // 5. Guardar cambios
            userDb.wallet = wallet - amount;
            userDb.bank = bank + amount;

            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\` *${config.visuals.emoji3}*\n\n`;
            texto += `*${config.visuals.emoji} Depositaste:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} Total en Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Restante en Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error("ERROR EN DEPOSIT:", e);
            m.reply(`*${config.visuals.emoji2}* Error de conexión con la base de datos.`);
        }
    }
};

export default depCommand;
