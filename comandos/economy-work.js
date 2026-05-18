import { config } from '../config.js';
import { database } from '../database.js';
import { workFrases } from './frases/work.js';

// Mapa para guardar los tiempos de cooldown en la memoria del bot
const cooldowns = new Map();

const workCommand = {
    name: 'work',
    alias: ['chamba', 'trabajar', 'w'],
    category: 'economy',
    desc: 'Realiza trabajos honrados para ganar coins.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m) => {
        try {
            const userJid = m.sender;
            const ahora = Date.now();
            const cooldownTime = 5 * 60 * 1000; // 5 minutos en milisegundos

            // 1. Verificar si el usuario ya está en el mapa de cooldowns
            if (cooldowns.has(userJid)) {
                const tiempoPasado = ahora - cooldowns.get(userJid);
                
                // Si aún no ha pasado el tiempo, le mostramos el mensaje de descanso
                if (tiempoPasado < cooldownTime) {
                    const restante = cooldownTime - tiempoPasado;
                    const minutos = Math.floor(restante / 60000);
                    const segundos = Math.floor((restante % 60000) / 1000);

                    let tiempoTexto = minutos > 0 ? `${minutos}m ${segundos}s` : `${segundos}s`;
                    return m.reply(`*${config.visuals.emoji2}* \`DESCANSO\`\n\n> Debes esperar **${tiempoTexto}** para volver a chambear.`);
                }
            }

            // 2. Obtener datos del usuario de la base de datos
            let userDb = await database.getUser(userJid);
            if (!userDb) {
                userDb = { 
                    wallet: 0, 
                    bank: 0, 
                    genre: 'No definido', 
                    marry: null, 
                    last_claim: new Date(0).toISOString()
                };
            }

            // 3. Generar recompensa y frase
            const recompensa = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
            const frase = workFrases[Math.floor(Math.random() * workFrases.length)];

            // 4. Sumar el dinero a la cartera
            userDb.wallet = Number(userDb.wallet || 0) + recompensa;

            // 5. Registrar el nuevo tiempo de la chamba en la memoria
            cooldowns.set(userJid, ahora);

            // 6. Armar el mensaje de éxito
            let texto = `*${config.visuals.emoji3}* \`CHAMBA EXITOSA\` *${config.visuals.emoji3}*\n\n`;
            texto += `${frase}\n`;
            texto += `*${config.visuals.emoji} Ganaste:* ¥${recompensa.toLocaleString()}\n\n`;
            texto += `> *Cartera:* ¥${userDb.wallet.toLocaleString()}`;

            // 7. Guardar en la base de datos y enviar mensaje
            await database.saveUser(userJid, userDb);
            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar la chamba.`);
        }
    }
};

export default workCommand;
