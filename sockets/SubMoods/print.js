import chalk from 'chalk';
import { config } from '../../config.js';

export const moodLogger = (m, conn) => {
    try {
        if (!m || !m.message || !m.key || m.key.remoteJid === 'status@broadcast') return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const botName = config.botName || 'Macs Bot';
        const name = m.pushName || 'Usuario';
        const sender = isGroup ? (m.key.participant || from) : from;
        const senderNumber = sender.split('@')[0].replace(/\D/g, '');

        const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
        const isRealOwner = senderNumber === realOwnerNumber || m.key.fromMe;

        const type = Object.keys(m.message).find(t => t !== 'senderKeyDistributionMessage' && t !== 'messageContextInfo') || '';
        if (!type || type === 'protocolMessage') return;

        let body = '';
        if (type === 'conversation') body = m.message.conversation;
        else if (type === 'extendedTextMessage') body = m.message.extendedTextMessage?.text || '';
        else body = `[Archivo: ${type.replace('Message', '')}]`;

        // Filtro anti-spam para comandos en privado
        if (!isGroup && !isRealOwner) {
            const text = body.trim().toLowerCase();
            const prefixes = config.allPrefixes || ['#', '!', '.'];
            const foundPrefix = prefixes.find(p => text.startsWith(p));

            const commandName = foundPrefix 
                ? text.slice(foundPrefix.length).trim().split(/ +/).shift()
                : text.trim().split(/ +/).shift();

            const allowedPrivateCmds = ['code', 'codemood', 'setname', 'setbanner'];
            if (!allowedPrivateCmds.includes(commandName)) return;
        }

        const time = new Date().toLocaleTimeString();
        const boxWidth = 55; // Ancho total de la caja ajustado
        const line = '═'.repeat(boxWidth);
        
        // Diseño Cyan/Tecnológico para Macs Bot
        const top = chalk.cyan(`╔${line}╗`);
        const bottom = chalk.cyan(`╚${line}╝`);
        const div = chalk.cyan(`╟${'─'.repeat(boxWidth)}╢`);
        const border = chalk.cyan('║');

        // Textos planos para un cálculo de espacios exacto y evitar que la caja se rompa
        const headerTxt = ` SOCKET: MACS MOOD - ${botName} `;
        const userTxt = ` USER: ${name.substring(0, 15)} (${senderNumber}) `;
        const chatTxt = ` CHAT: ${isGroup ? 'Grupo' : 'Privado'} `;
        const timeTxt = ` TIME: ${time} `;
        // Limita el tamaño del mensaje para que no rompa la caja
        const msgTxt = ` MSG:  ${body.substring(0, boxWidth - 10)} `;

        console.log(`
${top}
${border}${chalk.bold.cyan(headerTxt)}${' '.repeat(Math.max(0, boxWidth - headerTxt.length))}${border}
${div}
${border}${chalk.yellow(userTxt)}${' '.repeat(Math.max(0, boxWidth - userTxt.length))}${border}
${border}${chalk.yellow(chatTxt)}${' '.repeat(Math.max(0, boxWidth - chatTxt.length))}${border}
${border}${chalk.yellow(timeTxt)}${' '.repeat(Math.max(0, boxWidth - timeTxt.length))}${border}
${div}
${border}${chalk.italic.green(msgTxt)}${' '.repeat(Math.max(0, boxWidth - msgTxt.length))}${border}
${bottom}
        `);

    } catch (e) {
        // En caso de error crítico en el log, lo reportamos sin apagar el bot
        console.error(chalk.red(`  [❌ MACS MOOD Logger Error]: ${e.message}`));
    }
};
