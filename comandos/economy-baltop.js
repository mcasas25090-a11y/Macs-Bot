import { query } from '../database.js';

const balTopCommand = {
    name: 'baltop',
    alias: ['topbal', 'ranking', 'ricardos'],
    category: 'economy',
    desc: 'Muestra el top global de los usuarios más ricos con más coins.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const page = args[0] ? parseInt(args[0].replace(/[^0-9]/g, '')) : 1;
            if (isNaN(page) || page <= 0) {
                return m.reply(`*❁* El número de página debe ser un entero mayor a cero.\n\n» Ejemplo: *${usedPrefix || ''}${commandName} 2*`);
            }

            const res = await query('SELECT jid, wallet, bank FROM users WHERE (wallet + bank) > 0 ORDER BY (wallet + bank) DESC');
            const users = res.rows;

            if (!users || users.length === 0) {
                return m.reply(`*❁ \`RANKING VACÍO\` ❁*\n\n» No hay usuarios con coins registrados en la base de datos actualmente.`);
            }

            const itemsPerPage = 10;
            const totalPages = Math.ceil(users.length / itemsPerPage);

            if (page > totalPages) {
                return m.reply(`*❁* Esa página no existe.\n\n» Disponibles: *1 de ${totalPages}*`);
            }

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedUsers = users.slice(start, end);

            const mentions = [];
            let txt = `*❁ \`TOP GLOBAL DE RIQUEZA\` ❁*\n`;
            txt += `› Pág » *${page} de ${totalPages}*\n\n`;

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

            let footer = `> ¡Usa los comandos de economía para que seas el más rico!`;

            if (page === 1) {
                const userPosition = users.findIndex(u => u.jid === m.sender) + 1;

                if (userPosition === 1) {
                    footer = `> ¡Felicidades, disfruta de tu riqueza!`;
                } else if (userPosition === 2) {
                    footer = `> ¡Supera al de arriba y siéntete orgulloso de ti mismo!`;
                } else if (userPosition === 3) {
                    footer = `> ¡Solo te falta alcanzar esos dos para ser el más rico!`;
                }
            }

            txt += footer;

            return conn.sendMessage(m.chat, { text: txt, mentions }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default balTopCommand;