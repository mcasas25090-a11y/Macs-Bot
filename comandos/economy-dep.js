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
            
            // 1. Obtener datos
            let userDb = await database.getUser(userJid);
            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', last_claim: new Date(0).toISOString() };
            }

            let wallet = Number(userDb.wallet || 0);
            let bank = Number(userDb.bank || 0);

            if (wallet <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`CARTERA VACÍA\`\n\nNo tienes nada que depositar.`);
            }

            // 2. DETECCIÓN ULTRA-FLEXIBLE DE DATOS
            // Buscamos en args, en text, o directamente en el mensaje de m
            let fullText = text || args.join(' ') || (m.body ? m.body.split(' ').slice(1).join(' ') : '');
            let input = fullText.trim().toLowerCase();
            
            if (!input) {
                return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nUsa: *d [cantidad]* o *d all*.\n*Ejemplo:* #dep 5000`);
            }

            let amount;
            if (input.includes('all')) {
                amount = wallet;
            } else {
                amount = parseInt(input.replace(/[^0-9]/g, ''));
            }

            // 3. Validar números
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Cantidad inválida.`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* Solo tienes **¥${wallet.toLocaleString()}** en cartera.`);
            }

            // 4. Guardar
            userDb.wallet = wallet - amount;
            userDb.bank = bank + amount;

            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\` *${config.visuals.emoji3}*\n\n`;
            texto += `*${config.visuals.emoji} Guardaste:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} En Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error("ERROR EN DEPOSIT:", e);
            m.reply(`*${config.visuals.emoji2}* Error de base de datos. Verifica si Postgres está activo.`);
        }
    }
};

export default depCommand;
