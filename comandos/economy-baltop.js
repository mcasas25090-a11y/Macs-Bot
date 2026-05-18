import { config } from '../config.js';
import { database } from '../database.js';

const baltopCommand = {
    name: 'baltop',
    alias: ['topbalance', 'ranking'],
    category: 'economy',
    desc: 'Ranking de los más ricos.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Consulta ultra-segura: convertimos a NUMERIC para evitar el error "text + text"
            // NULLIF maneja casos donde el campo esté vacío
            const query = `
                SELECT jid, wallet, bank 
                FROM users 
                ORDER BY (
                    CAST(NULLIF(NULLIF(wallet, ''), 'NaN') AS NUMERIC) + 
                    CAST(NULLIF(NULLIF(bank, ''), 'NaN') AS NUMERIC)
                ) DESC 
                LIMIT 10
            `;
            
            const res = await database.pool.query(query);
            const topUsers = res.rows;

            if (!topUsers || topUsers.length === 0) return m.reply("No hay usuarios en la base de datos.");

            let text = `*${config.visuals?.emoji3 || '🏆'}* \`RANKING V2\`\n\n`;
            
            topUsers.forEach((user, i) => {
                const jid = user.jid ? user.jid.split('@')[0] : 'Desconocido';
                // BigInt para manejar tus trillones sin que salgan como "4.1e+12"
                const w = BigInt(String(user.wallet || '0').replace(/\D/g, '') || '0');
                const b = BigInt(String(user.bank || '0').replace(/\D/g, '') || '0');
                const total = w + b;
                
                text += `*${i + 1}.* @${jid}\n`;
                text += `*¥* ${total.toLocaleString()}\n\n`;
            });

            text += `> Usa #bal para ver tu balance.`;

            await conn.sendMessage(m.chat, { text, mentions: topUsers.map(u => u.jid).filter(j => j) }, { quoted: m });

        } catch (e) {
            console.error("ERROR CRITICO EN BALTOP:", e);
            // Si sale este mensaje, pásame lo que dice después de "DETALLE:"
            m.reply(`*🚨 ERROR DE SQL V2*\n*DETALLE:* ${e.message}`);
        }
    }
};

export default baltopCommand;
