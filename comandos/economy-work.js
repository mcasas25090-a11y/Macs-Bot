import { database } from '../database.js';
import { workFrases } from './frases/work.js';

const workCommand = {
    name: 'work',
    alias: ['w', 'trabajar', 'chamba'],
    category: 'economy',
    desc: 'Realiza un trabajo del mundo real para ganar coins.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const user = global.db.data.users[m.sender];
            const now = new Date();
            const lastWork = new Date(user.last_work || '1970-01-01T00:00:00.000Z');

            const difference = now - lastWork;
            const cooldownTime = 5 * 60 * 1000;

            if (difference < cooldownTime) {
                const timeLeft = cooldownTime - difference;
                const minutes = Math.floor(timeLeft / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                return m.reply(`*❁ ¡ESPERA UN MOMENTO! ❁*\n\n» Debes esperar *${minutes}m ${seconds}s* antes de volver a trabajar.`);
            }

            user.last_work = now.toISOString();

            const frase = workFrases[Math.floor(Math.random() * workFrases.length)];
            const reward = Math.floor(Math.random() * (12000 - 5000 + 1)) + 5000;

            user.wallet = (user.wallet || 0) + reward;
            await database.saveUser(m.sender, user);

            let txt = `*❁ \`JORNADA LABORAL\` ❁*\n\n`;
            txt += `» ${frase}\n`;
            txt += `*✰ Ganaste »* $${reward.toLocaleString()} coins\n\n`;
            txt += `> ✿ El esfuerzo rinde frutos, ¡sigue trabajando duro!`;

            return m.reply(txt);

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default workCommand;