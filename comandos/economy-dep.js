import { config } from '../config.js';
import { database } from '../database.js';

const depCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Asegura tus coins enviándolas al banco.',
    noPrefix: true,

    run: async (conn, m, { args, text }) => {
        try {
            const userJid = m.sender;
            let userDb = await database.getUser(userJid);
            if (!userDb) userDb = { wallet: 0, bank: 0 };

            let wallet = Number(userDb.wallet || 0);

            // 1. Validación de cartera
            if (wallet <= 0) {
                return m.reply(`*${config.visuals.emoji2}* No tienes dinero para depositar.`);
            }

            // 2. DETECCIÓN MANUAL (Para que no diga "Faltan datos")
            // Si 'text' o 'args' fallan, leemos directamente el mensaje 'm.text'
            let cuerpoMensaje = (text || (args && args.join(' ')) || m.text || "").toLowerCase().trim();
            
            // Quitamos el comando (ej: si es "d all", nos quedamos solo con "all")
            let valor = cuerpoMensaje.replace(/^d\s+|^dep\s+|^deposit\s+|^depositar\s+/, "").trim();

            if (!valor) {
                return m.reply(`*${config.visuals.emoji2}* \`FALTAN DATOS\`\n\nIngresa una cantidad o usa **all**.\n*Ejemplo:* #d 5000`);
            }

            let amount;
            if (valor.includes('all') || valor.includes('todo')) {
                amount = wallet;
            } else {
                amount = parseInt(valor.replace(/[^0-9]/g, ''));
            }

            // 3. Validar el número final
            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Cantidad inválida. Usa un número o *all*.`);
            }

            if (amount > wallet) {
                return m.reply(`*${config.visuals.emoji2}* Solo tienes ¥${wallet.toLocaleString()} en cartera.`);
            }

            // 4. Guardar cambios
            userDb.wallet = wallet - amount;
            userDb.bank = Number(userDb.bank || 0) + amount;

            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`DEPÓSITO EXITOSO\`\n\n`;
            texto += `*${config.visuals.emoji} Monto:* ¥${amount.toLocaleString()}\n`;
            texto += `*${config.visuals.emoji4} Banco:* ¥${userDb.bank.toLocaleString()}\n\n`;
            texto += `> *Restante:* ¥${userDb.wallet.toLocaleString()}`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error("ERROR EN DEPOSIT:", e);
            m.reply(`*${config.visuals.emoji2}* Error de base de datos.`);
        }
    }
};

export default depCommand;
