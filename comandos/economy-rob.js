import { database } from '../database.js';

const robCommand = {
    name: 'rob',
    alias: ['robar', 'quitarcoins', 'atracar'],
    category: 'economy',
    desc: 'Roba todo el dinero en efectivo de la billetera de un usuario inactivo.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            let who;
            if (m.quoted && m.quoted.sender) {
                who = m.quoted.sender;
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                who = m.mentionedJid[0];
            }

            if (!who) {
                return m.reply(`*❁* Debes mencionar a un usuario o responder a su mensaje para cometer el asalto.\n\n» Ejemplo: *${usedPrefix || ''}${commandName} @user*`);
            }

            if (who === m.sender) {
                return m.reply(`*❁* No puedes robarte a ti mismo, búscate una víctima real.`);
            }

            let thief = global.db.data.users[m.sender];
            const now = new Date();
            const lastRob = new Date(thief.last_rob || '1970-01-01T00:00:00.000Z');

            const thiefDifference = now - lastRob;
            const thiefCooldown = 20 * 60 * 1000;

            if (thiefDifference < thiefCooldown) {
                const timeLeft = thiefCooldown - thiefDifference;
                const minutes = Math.floor(timeLeft / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                return m.reply(`*❁ ¡ESPERA UN MOMENTO! ❁*\n\n» Estás bajo la mira de las autoridades. Espera *${minutes}m ${seconds}s* antes de planear otro golpe.`);
            }

            let victim = global.db.data.users[who];
            if (!victim) {
                victim = await database.getUser(who);
            }

            if (!victim) {
                return m.reply(`*❁* La víctima seleccionada no tiene un registro activo en el sistema.`);
            }

            const victimWallet = victim.wallet || 0;
            if (victimWallet <= 0) {
                return conn.sendMessage(m.chat, { text: `*❁ \`BILLETERA VACÍA\` ❁*\n\n» @${who.split('@')[0]} no lleva dinero encima en este momento. Sus fondos están a salvo en el banco.`, mentions: [who] }, { quoted: m });
            }

            const timestamps = [
                victim.last_claim,
                victim.last_crime,
                victim.last_work,
                victim.last_slut,
                victim.last_flip,
                victim.last_rob
            ];

            let lastActivityTime = new Date('1970-01-01T00:00:00.000Z').getTime();
            timestamps.forEach(ts => {
                if (ts) {
                    const time = new Date(ts).getTime();
                    if (time > lastActivityTime) lastActivityTime = time;
                }
            });

            const victimDifference = now.getTime() - lastActivityTime;
            const victimRequiredInactivity = 30 * 60 * 1000;

            if (victimDifference < victimRequiredInactivity) {
                const remainingInactivity = victimRequiredInactivity - victimDifference;
                const minLeft = Math.ceil(remainingInactivity / (1000 * 60));
                return conn.sendMessage(m.chat, { text: `*❁ \`OBJETIVO ALERTA\` ❁*\n\n» @${who.split('@')[0]} ha estado activo recientemente en el bot.\n» Debes esperar a que baje la guardia y esté completamente inactivo (Faltan aprox. *${minLeft}m*).`, mentions: [who] }, { quoted: m });
            }

            thief.last_rob = now.toISOString();

            thief.wallet = (thief.wallet || 0) + victimWallet;
            victim.wallet = 0;

            global.db.data.users[m.sender] = thief;
            global.db.data.users[who] = victim;

            await database.saveUser(m.sender, thief);
            await database.saveUser(who, victim);

            let txt = `*❁ \`ASALTO TOTAL EXCEPCIONAL\` ❁*\n\n`;
            txt += `» ¡Aprovechaste el descuido del usuario a la perfección!\n`;
            txt += `*❀ Ladrón »* @${m.sender.split('@')[0]}\n`;
            txt += `*✿ Víctima »* @${who.split('@')[0]}\n`;
            txt += `*✰ Botín Extraído »* $${victimWallet.toLocaleString()} coins de su cartera\n\n`;
            txt += `> ✰ Asegura tus ganancias en el banco antes de que te pase lo mismo.`;

            return conn.sendMessage(m.chat, { text: txt, mentions: [m.sender, who] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default robCommand;