import { config } from '../config.js';
import { database } from '../database.js';
import { winFrases, loseFrases } from './frases/slut.js';

// Mapa para el cooldown en memoria (10 minutos)
const cooldowns = new Map();

const slutCommand = {
    name: 'slut',
    alias: ['prostituirse', 'escenario'],
    category: 'economy',
    desc: 'Trabaja en el escenario para ganar coins.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            const userJid = m.sender;
            const ahora = Date.now();
            const cooldownTime = 10 * 60 * 1000; // 10 minutos

            // 1. Verificar Cooldown
            if (cooldowns.has(userJid)) {
                const tiempoPasado = ahora - cooldowns.get(userJid);
                if (tiempoPasado < cooldownTime) {
                    const restante = cooldownTime - tiempoPasado;
                    const minutos = Math.floor(restante / 60000);
                    const segundos = Math.floor((restante % 60000) / 1000);
                    return m.reply(`*${config.visuals.emoji2}* \`AGOTAMIENTO\`\n\n> Necesitas descansar. Vuelve en **${minutos}m ${segundos}s**.`);
                }
            }

            // 2. Obtener datos de la base de datos PostgreSQL
            let userDb = await database.getUser(userJid);
            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', last_claim: new Date(0).toISOString() };
            }

            const esPerdida = Math.random() < 0.03; // 3% de probabilidad de perder
            const monto = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;

            let msg = '';
            if (esPerdida) {
                const frase = loseFrases[Math.floor(Math.random() * loseFrases.length)];
                userDb.wallet = Math.max(0, (Number(userDb.wallet) || 0) - monto);

                msg = `*${config.visuals.emoji2}* \`MALA NOCHE\`\n\n`;
                msg += `${frase}\n`;
                msg += `*Perdiste:* ¥${monto.toLocaleString()}\n\n`;
            } else {
                const frase = winFrases[Math.floor(Math.random() * winFrases.length)];
                userDb.wallet = (Number(userDb.wallet) || 0) + monto;

                msg = `*${config.visuals.emoji3}* \`NOCHE DE ÉXITO\` *${config.visuals.emoji3}*\n\n`;
                msg += `${frase}\n`;
                msg += `*Ganaste:* ¥${monto.toLocaleString()}\n\n`;
            }

            msg += `> *Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            // 3. Guardar Cooldown y Datos
            cooldowns.set(userJid, ahora);
            await database.saveUser(userJid, userDb);
            
            await m.reply(msg);

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error en la función.`);
        }
    }
};

export default slutCommand;
