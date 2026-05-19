import { database } from '../database.js';

const withdrawCommand = {
    name: 'withdraw',
    alias: ['ret', 'retirar', 'with'],
    category: 'economy',
    desc: 'Retira tus coins del banco a la billetera.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const user = global.db.data.users[m.sender];
            const bank = user.bank || 0;

            if (!args[0]) {
                return m.reply(`*❁ ¡ERROR DE USO! ❁*\n\n» Especifica una cantidad o escribe *all*.\n» Ejemplo: *${usedPrefix || ''}${commandName} 5000* o *${usedPrefix || ''}${commandName} all*`);
            }

            let amount;
            if (args[0].toLowerCase() === 'all') {
                amount = bank;
            } else {
                amount = parseInt(args[0].replace(/[^0-9]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*❁ ¡CANTIDAD INVÁLIDA! ❁*\n\n» Ingresa un número entero mayor a cero o la palabra *all*.`);
            }

            if (bank < amount) {
                return m.reply(`*❁ \`FONDOS INSUFICIENTES\` ❁*\n\n» No tienes esa cantidad en tu banco.\n» Dispones de: *$${bank.toLocaleString()}* coins.`);
            }

            user.bank = bank - amount;
            user.wallet = (user.wallet || 0) + amount;

            await database.saveUser(m.sender, user);

            let txt = `*❁ \`RETIRO EXITOSO\` ❁*\n\n`;
            txt += `» Has retirado tus coins para usarlos libremente.\n`;
            txt += `*❀ Retirado »* $${amount.toLocaleString()} coins\n`;
            txt += `*✿ En Banco »* $${user.bank.toLocaleString()} coins\n`;
            txt += `*✰ En Billetera »* $${user.wallet.toLocaleString()} coins\n\n`;
            txt += `> ✰ Recuerda que en la billetera quedas expuesto a robos.`;

            return m.reply(txt);

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default withdrawCommand;