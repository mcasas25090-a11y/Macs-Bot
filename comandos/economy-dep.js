import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas de tu cartera al banco.',
    noPrefix: true,

    run: async (conn, m, { args }) => {
        try {
            // Limpiamos el JID para que Postgres no dé error de formato
            const userJid = m.sender.split('@')[0] + '@s.whatsapp.net';
            
            // 1. Obtener datos de la DB
            let userDb = await database.getUser(userJid);
            
            if (!userDb) {
                return m.reply(`*${config.visuals.emoji2}* No tienes una cuenta registrada. ¡Usa el bot para crear una!`);
            }

            // Convertir a número para evitar el error de "NaN" o concatenación de texto
            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);

            if (wallet <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`CARTERA VACÍA\`\n\nNo tienes dinero para depositar.`);
            }

            let input = args[0];
            if (!input) return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nIngresa una cantidad o usa *all*.`);

            let amount;
            if (input.toLowerCase() === 'all') {
                amount = wallet;
            } else {
                // Quitamos cualquier símbolo que no sea número
                amount = parseInt(input.replace(/[^0-9]/g, ''));
            }

            // 2. Validación de cantidad máxima posible
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Por favor, ingresa un número válido.`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* \`FONDOS INSUFICIENTES\`\n\nNo puedes depositar **¥${amount.toLocaleString()}** porque solo tienes **¥${wallet.toLocaleString()}**.`);
            }

            // 3. Actualizar el objeto con los nombres de columnas que creamos en Postgres
            userDb.wallet = wallet - amount;
            userDb.bank = bank + amount;

            // 4. Guardar cambios
            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\` *${config.visuals.emoji3}*\n\n`;
            texto += `*${config.visuals.emoji} Depositaste:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} Ahora en Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Restante en Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            // Esto imprimirá el error real en tu Termux para que sepas qué falló
            console.error("ERROR EN DEPOSIT:", e);
            m.reply(`*${config.visuals.emoji2}* Error de conexión con la base de datos.`);
        }
    }
};

export default depCommand;
