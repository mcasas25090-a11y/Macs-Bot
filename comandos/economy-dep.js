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
            const userJid = m.sender;
            
            // 1. Obtener datos del usuario
            let userDb = await database.getUser(userJid);
            
            // Si el usuario no existe en la DB, lo inicializamos
            if (!userDb) {
                userDb = { 
                    wallet: 0, 
                    bank: 0, 
                    genre: 'No definido', 
                    marry: null, 
                    last_claim: new Date(0).toISOString() 
                };
            }

            // Aseguramos que los valores sean números
            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);

            // 2. Validaciones iniciales
            if (wallet <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`CARTERA VACÍA\`\n\nNo tienes dinero para depositar.`);
            }

            let input = args && args[0] ? args[0] : null;
            if (!input) return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nIngresa una cantidad o usa *all*.\n*Ejemplo:* #dep 5000`);

            let amount;
            if (input.toLowerCase() === 'all') {
                amount = wallet;
            } else {
                amount = parseInt(input.replace(/[^0-9]/g, ''));
            }

            // 3. Validación de la cantidad solicitada
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Cantidad inválida.`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* \`FONDOS INSUFICIENTES\`\n\nNo puedes depositar **¥${amount.toLocaleString()}** porque solo tienes **¥${wallet.toLocaleString()}**.`);
            }

            // 4. Actualizar el objeto (Usando los nombres exactos de tu tabla Postgres)
            userDb.wallet = wallet - amount;
            userDb.bank = bank + amount;

            // 5. Guardar en la base de datos (Igual que en work.js)
            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\` *${config.visuals.emoji3}*\n\n`;
            texto += `*${config.visuals.emoji} Depositaste:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} Total en Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Restante en Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error("CRITICAL ERROR IN DEPOSIT:", e);
            m.reply(`*${config.visuals.emoji2}* Error interno. Revisa la consola de Termux.`);
        }
    }
};

export default depCommand;
