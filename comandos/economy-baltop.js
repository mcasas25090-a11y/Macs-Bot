import { config } from '../config.js';
import { database } from '../database.js';

const baltopCommand = {
    name: 'baltop',
    alias: ['topbalance', 'ranking'],
    category: 'economy',
    desc: 'Muestra a los usuarios más ricos.',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // SOLUCIÓN AL ERROR: Convertimos el texto a NUMERIC solo para la suma y el orden
            const query = `
                SELECT jid, wallet, bank 
                FROM users 
                ORDER BY (CAST(COALESCE(wallet, '0') AS NUMERIC) + CAST(COALESCE(bank, '0') AS NUMERIC)) DESC 
                LIMIT 10
            `;
            
            const res = await database.pool.query(query);
            const topUsers = res.rows;

            if (topUsers.length === 0) return m.reply("No hay usuarios registrados en la economía.");

            let text = `*${config.visuals?.emoji3 || '🏆'}* \`RANKING DE RIQUEZA\`\n\n`;
            
            topUsers.forEach((user, i) => {
                const jid = user.jid.split('@')[0];
                // Usamos BigInt para mostrar los números gigantes sin errores de redondeo
                const total = BigInt(user.wallet || 0) + BigInt(user.bank || 0);
                text += `*${i + 1}.* @${jid}\n`;
                text += `*¥* ${total.toLocaleString()}\n\n`;
            });

            text += `> Usa #bal para ver tu posición.`;

            m.reply(text, { mentions: topUsers.map(u => u.jid) });

        } catch (e) {
            console.error("Error en Baltop:", e);
            m.reply(`*🚨 ERROR DE SQL:*\n${e.message}`);
        }
    }
};

export default baltopCommand;
