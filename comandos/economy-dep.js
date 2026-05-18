import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas al banco.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);
            if (!userDb) userDb = { wallet: 0, bank: 0 };

            let wallet = Number(userDb.wallet || 0);
            if (wallet <= 0) return m.reply(`*${config.visuals.emoji2}* No tienes dinero en cartera.`);

            // EL TRUCO: Leemos el mensaje directamente desde el objeto 'm'
            // m.body o m.text contiene lo que escribiste: "D all"
            let textoCompleto = (m.body || m.text || "").toLowerCase().trim();
            
            let amount = 0;

            // Buscamos si la palabra 'all' o 'todo' está en CUALQUIER PARTE del mensaje
            if (textoCompleto.includes('all') || textoCompleto.includes('todo')) {
                amount = wallet;
            } else {
                // Si no es 'all', buscamos el número
                let numeroEncontrado = textoCompleto.replace(/[^0-9]/g, '');
                amount = parseInt(numeroEncontrado);
            }

            if (!amount || isNaN(amount) || amount <= 0) {
                // Si llegamos aquí, es que no detectó ni 'all' ni un número
                return m.reply(`*${config.visuals.emoji2}* \`DATOS NO DETECTADOS\`\n\nEscribiste: "${textoCompleto}"\nIntenta usar: **#d 500** o **#d all**`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* Solo tienes ¥${wallet.toLocaleString()} en cartera.`);
            }

            // Actualizar
            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            await database.saveUser(userJid, userDb);

            let exito = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\`\n\n`;
            exito += `*¥* Monto: ${amount.toLocaleString()}\n`;
            exito += `*¥* Banco: ${userDb.bank.toLocaleString()}`;
            
            await conn.sendMessage(m.chat, { text: exito }, { quoted: m });

        } catch (e) {
            console.error("ERROR CRITICO:", e);
            m.reply("Error de conexión.");
        }
    }
};

export default depCommand;
