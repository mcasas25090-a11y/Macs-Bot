import { config } from '../config.js';
import { database } from '../database.js';

const economyInfoCommand = {
    name: 'economy',
    alias: ['einfo', 'ecoinfo'],
    category: 'economy',
    desc: 'Muestra el tiempo transcurrido desde el último uso de los comandos.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Captura segura de JID (Mención, Mensaje Respondido o Emisor)
            let who;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                who = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.quoted) {
                who = m.quoted.sender;
            } else {
                who = m.sender;
            }

            // Búsqueda del usuario en la base de datos
            let user = global.db?.data?.users?.[who];
            if (!user) {
                user = await database.getUser(who);
            }

            if (!user) {
                return m.reply(`*${config.visuals.emoji2}* El usuario seleccionado no se encuentra registrado en la base de datos.`);
            }

            const userId = who.split('@')[0];
            const now = Date.now();

            // Función para calcular el tiempo transcurrido
            const formatTimeAgo = (lastTimeIso) => {
                if (!lastTimeIso || lastTimeIso === '1970-01-01T00:00:00.000Z') return 'Nunca';

                const lastTime = new Date(lastTimeIso).getTime();
                const difference = now - lastTime;

                if (difference < 0) return 'Hace un momento';

                const seconds = Math.floor(difference / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 0) return `Hace ${days}d`;
                if (hours > 0) return `Hace ${hours}h`;
                if (minutes > 0) return `Hace ${minutes}m`;
                return `Hace ${seconds}s`;
            };

            const dailyFmt = formatTimeAgo(user.last_claim);
            const crimeFmt = formatTimeAgo(user.last_crime);
            const workFmt = formatTimeAgo(user.last_work);
            const slutFmt = formatTimeAgo(user.last_slut);

            const wallet = user.wallet || 0;
            const bank = user.bank || 0;
            const totalCoins = wallet + bank;

            // Construcción del mensaje con estética Macs Bot
            let message = `*${config.visuals.emoji3} \`ESTADÍSTICAS GLOBALES\` ${config.visuals.emoji3}*\n\n`;
            message += `› @${userId}\n\n`;
            message += `ⴵ Daily » ${dailyFmt}\n`;
            message += `ⴵ Work » ${workFmt}\n`;
            message += `ⴵ Crime » ${crimeFmt}\n`;
            message += `ⴵ Slut » ${slutFmt}\n\n`;
            message += `*⛁* Coins totales » *$${totalCoins.toLocaleString()}*`;

            return conn.sendMessage(m.chat, { 
                text: message, 
                mentions: [who] 
            }, { quoted: m });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO ECONOMY]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error interno al procesar el estado de economía.`);
        }
    }
};

export default economyInfoCommand;
