import { config } from '../config.js';
import { query } from '../database.js';

const balTopCommand = {
    name: 'baltop',
    alias: ['topbal', 'ranking', 'ricardos'],
    category: 'economy',
    desc: 'Muestra el top global de los usuarios más ricos con más coins.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix = '', commandName = 'baltop') => {
        try {
            // Validación de la página solicitada
            const page = args[0] ? parseInt(args[0].replace(/[^0-9]/g, '')) : 1;
            if (isNaN(page) || page <= 0) {
                return m.reply(`*${config.visuals.emoji2}* El número de página debe ser un entero mayor a cero.\n\n» Ejemplo: *${usedPrefix}${commandName} 2*`);
            }

            // Consulta a la base de datos
            const res = await query('SELECT jid, wallet, bank FROM users WHERE (wallet + bank) > 0 ORDER BY (wallet + bank) DESC');
            const users = res.rows || res; // Soporte por si 'query' devuelve el array directo o un objeto con 'rows'

            if (!users || users.length === 0) {
                return m.reply(`*${config.visuals.emoji3} \`RANKING VACÍO\` ${config.visuals.emoji3}*\n\n» No hay usuarios con coins registrados en la base de datos actualmente.`);
            }

            // Lógica de paginación
            const itemsPerPage = 10;
            const totalPages = Math.ceil(users.length / itemsPerPage);

            if (page > totalPages) {
                return m.reply(`*${config.visuals.emoji2}* Esa página no existe.\n\n» Páginas disponibles: *1 a ${totalPages}*`);
            }

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedUsers = users.slice(start, end);

            const mentions = [];
            let txt = `*${config.visuals.emoji3} \`TOP GLOBAL DE RIQUEZA\` ${config.visuals.emoji3}*\n`;
            txt += `› Pág » *${page} de ${totalPages}*\n\n`;

            // Construcción de la lista
            paginatedUsers.forEach((user, index) => {
                const globalIndex = start + index + 1;
                const total = (user.wallet || 0) + (user.bank || 0);
                const bank = user.bank || 0;
                const jid = user.jid;

                mentions.push(jid);

                let medal = `${globalIndex}.`;
                if (globalIndex === 1) medal = '🥇';
                if (globalIndex === 2) medal = '🥈';
                if (globalIndex === 3) medal = '🥉';

                txt += `${medal} @${jid.split('@')[0]}\n`;
                txt += `  *❀ Banco »* $${bank.toLocaleString()} coins\n`;
                txt += `  *✰ Total Neto »* $${total.toLocaleString()} coins\n\n`;
            });

            // Lógica del pie de página personalizado
            let footer = `> ¡Usa los comandos de economía para ser el más rico!`;

            if (page === 1) {
                const userPosition = users.findIndex(u => u.jid === m.sender) + 1;

                if (userPosition === 1) {
                    footer = `> ¡Felicidades, disfruta de tu inmensa riqueza!`;
                } else if (userPosition === 2) {
                    footer = `> ¡Supera al de arriba y siéntete orgulloso de ti mismo!`;
                } else if (userPosition === 3) {
                    footer = `> ¡Solo te falta superar a dos para dominar la economía!`;
                }
            }

            txt += footer;

            // Enviar mensaje con menciones masivas para que los @ números se formatien correctamente
            return conn.sendMessage(m.chat, { text: txt, mentions }, { quoted: m });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO BALTOP]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error interno al generar el ranking global.`);
        }
    }
};

export default balTopCommand;
