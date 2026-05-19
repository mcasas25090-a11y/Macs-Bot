import { database } from '../database.js';

const depositCommand = {
    name: 'deposit',
    alias: ['dep', 'd', 'depositar'],
    category: 'economy',
    desc: 'Deposita tus coins de la billetera al banco.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const user = global.db.data.users[m.sender];
            const wallet = user.wallet || 0;

            if (!args[0]) {
                return m.reply(`*❁ ¡ERROR DE USO! ❁*\n\n» Especifica una cantidad o escribe *all*.\n» Ejemplo: *${usedPrefix || ''}${commandName} 5000* o *${usedPrefix || ''}${commandName} all*`);
            }

            let amount;
            if (args[0].toLowerCase() === 'all') {
                amount = wallet;
            } else {
                amount = parseInt(args[0].replace(/[^0-9]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*❁ ¡CANTIDAD INVÁLIDA! ❁*\n\n» Ingresa un número entero mayor a cero o la palabra *all*.`);
            }

            if (wallet < amount) {
                return m.reply(`*❁ \`FONDOS INSUFICIENTES\` ❁*\n\n» No tienes esa cantidad en tu billetera.\n» Dispones de: *$${wallet.toLocaleString()}* coins.`);
            }

            user.wallet = wallet - amount;
            user.bank = (user.bank || 0) + amount;

            await database.saveUser(m.sender, user);

            let txt = `*❁ \`DEPÓSITO EXITOSO\` ❁*\n\n`;
            txt += `» Has asegurado tus coins en la bóveda.\n`;
            txt += `*❀ Depositado »* $${amount.toLocaleString()} coins\n`;
            txt += `*✿ En Billetera »* $${user.wallet.toLocaleString()} coins\n`;
            txt += `*✰ En Banco »* $${user.bank.toLocaleString()} coins\n\n`;
            txt += `> ✰ Tus fondos se encuentran protegidos de robos.`;

            return m.reply(txt);

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default depositCommand;