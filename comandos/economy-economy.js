import { database } from '../database.js';

const economyInfoCommand = {
    name: 'economy',
    alias: ['einfo', 'ecoinfo'],
    category: 'economy',
    desc: 'Muestra el tiempo transcurrido desde el último uso de los comandos.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            let who;
            if (m.isGroup) {
                who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted && m.quoted.sender ? m.quoted.sender : m.sender);
            } else {
                who = m.quoted && m.quoted.sender ? m.quoted.sender : m.sender;
            }

            let user = global.db.data.users[who];
            if (!user) {
                user = await database.getUser(who);
            }

            if (!user) {
                return m.reply('*❁ ¡ERROR! ❁*\n\n» El usuario no está registrado en la base de datos.');
            }

            const userId = who.split('@')[0];
            const now = Date.now();

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

            let message = `*❁* \`ESTADÍSTICAS GLOBALES\` *❁*\n\n`;
            message += `› @${userId}\n\n`;
            message += `ⴵ Daily » ${dailyFmt}\n`;
            message += `ⴵ Work » ${workFmt}\n`;
            message += `ⴵ Crime » ${crimeFmt}\n`;
            message += `ⴵ Slut » ${slutFmt}\n\n`;
            message += `*⛁* Coins totales » *$${totalCoins.toLocaleString()}*`;

            return conn.sendMessage(m.chat, { text: message, mentions: [who] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default economyInfoCommand;;