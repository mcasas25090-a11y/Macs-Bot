import { config } from '../config.js';
import { database } from '../database.js'; // Importante para tu base de datos actual

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas de tu cartera al banco.',
    noPrefix: true,

    run: async (conn, m, { args }) => {
        try {
            const userJid = m.sender;
            
            // 1. Obtener datos reales de PostgreSQL
            let userDb = await database.getUser(userJid);
            if (!userDb) {
                return m.reply(`*${config.visuals.emoji2}* No tienes una cuenta activa en el sistema.`);
            }

            // Convertimos a número por seguridad (Postgres a veces devuelve strings)
            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);

            // 2. Validación de cartera vacía
            if (wallet <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`CARTERA VACÍA\`\n\nNo tienes dinero en tu cartera para depositar.`);
            }

            let input = args[0];
            if (!input) return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nIngresa una cantidad o usa *all*.\n*Ejemplo:* #dep 5000`);

            let amount;
            if (input.toLowerCase() === 'all') {
                amount = wallet;
            } else {
                amount = parseInt(input.replace(/[^0-9]/g, ''));
            }

            // 3. Medición y Validación de cantidad
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Cantidad inválida. Por favor ingresa un número real.`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* \`FONDOS INSUFICIENTES\`\n\nIntentaste depositar **¥${amount.toLocaleString()}**, pero solo tienes **¥${wallet.toLocaleString()}** en tu cartera.\n\n> Usa \`#dep all\` para depositarlo todo.`);
            }

            // 4. Actualizar valores
            userDb.wallet = wallet - amount;
            userDb.bank = bank + amount;

            // 5. Guardar en PostgreSQL
            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\` *${config.visuals.emoji3}*\n\n`;
            texto += `*${config.visuals.emoji} Monto depositado:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} Total en Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Restante en Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar el depósito en la base de datos.`);
        }
    }
};

export default depCommand;
