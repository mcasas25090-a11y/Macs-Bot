import { config } from '../config.js';
import { database } from '../database.js';

const balanceCommand = {
    name: 'balance',
    alias: ['bal', 'wallet', 'banco', 'coins'],
    category: 'economy',
    desc: 'Muestra tu balance actual de coins.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Captura de JID (Mención, Mensaje Respondido o Emisor)
            let who;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                who = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.quoted) {
                who = m.quoted.sender;
            } else {
                who = m.sender;
            }

            // Búsqueda del usuario en la base de datos (Memoria o SQLite)
            let user = global.db?.data?.users?.[who];
            if (!user) {
                user = await database.getUser(who);
            }

            // Creación del perfil si no existe
            if (!user) {
                user = { 
                    wallet: 0, 
                    bank: 0, 
                    genre: 'No definido', 
                    marry: null, 
                    last_claim: '1970-01-01T00:00:00.000Z', 
                    last_crime: '1970-01-01T00:00:00.000Z', 
                    last_work: '1970-01-01T00:00:00.000Z', 
                    last_slut: '1970-01-01T00:00:00.000Z', 
                    last_flip: '1970-01-01T00:00:00.000Z', 
                    last_rob: '1970-01-01T00:00:00.000Z' 
                };
                
                // Guardado seguro en la base de datos
                if (global.db?.data?.users) {
                    global.db.data.users[who] = user;
                }
                await database.saveUser(who, user);
            }

            const wallet = user.wallet || 0;
            const bank = user.bank || 0;
            const total = wallet + bank;

            // Construcción del mensaje con estética Macs Bot
            let txt = `*${config.visuals.emoji3} \`BALANCE DE CUENTA\` ${config.visuals.emoji3}*\n\n`;
            txt += `» *Usuario:* @${who.split('@')[0]}\n`;
            txt += `*❀ Billetera »* $${wallet.toLocaleString()} coins\n`;
            txt += `*✿ Banco »* $${bank.toLocaleString()} coins\n`;
            txt += `*✰ Total Neto »* $${total.toLocaleString()} coins\n\n`;
            txt += `> ¡Sigue sumando coins para dominar la economía!`;

            // Enviar mensaje con la mención correspondiente
            return conn.sendMessage(m.chat, { 
                text: txt, 
                mentions: [who] 
            }, { quoted: m });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO BALANCE]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error interno al procesar el balance de cuenta.`);
        }
    }
};

export default balanceCommand;
