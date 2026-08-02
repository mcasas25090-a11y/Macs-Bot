import { config } from '../config.js';

const kickCommand = {
    name: 'kick',
    alias: ['sacar', 'ban', 'eliminar'],
    category: 'admins',
    desc: 'Expulsa a un miembro del grupo mediante una mención o respondiendo a su mensaje.',
    isAdmin: true,
    isGroup: true, // Asegura que solo se ejecute dentro de grupos
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Utilizamos tu función global para validar si el bot es admin
            const { isBotAdmin } = await conn.getAdminStatus(m.chat, m.sender);

            if (!isBotAdmin) {
                return m.reply(`*${config.visuals.emoji2}* El bot no posee rango de Administrador. No tengo poder para eliminar miembros del grupo.\n\n> ¡Solicita el rango si deseas automatizar esta función!`);
            }

            // Captura de JID (Mención o Mensaje Respondido)
            let targetJid;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.quoted) {
                // Usamos la estructura m.quoted.sender del index.js
                targetJid = m.quoted.sender; 
            }

            if (!targetJid) {
                return m.reply(`*${config.visuals.emoji2}* Debes mencionar a alguien o responder a su mensaje para ejecutar la purga.\n\n> ¡Indica a quién debemos eliminar del grupo!`);
            }

            // Normalización de números
            const userToKick = targetJid.split('@')[0].split(':')[0] + '@s.whatsapp.net';
            const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            
            // Extracción segura del número del owner
            const ownerRaw = typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0];
            const ownerNumber = ownerRaw.replace(/\D/g, '') + '@s.whatsapp.net';

            // Verificaciones de Inmunidad
            if (userToKick === m.sender) {
                return m.reply(`*${config.visuals.emoji2}* No puedes eliminarte a ti mismo de la existencia.\n\n> ¡Si deseas irte, hazlo manualmente!`);
            }

            if (userToKick === ownerNumber) {
                return m.reply(`*${config.visuals.emoji2}* Has intentado atacar al Creador. La acción ha sido bloqueada.\n\n> ¡Nadie toca al Owner en este servidor!`);
            }

            if (userToKick === botNumber) {
                return m.reply(`*${config.visuals.emoji2}* ¿Intentas sacarme a mí? Qué atrevido...`);
            }

            // Validación de privilegios del objetivo
            const groupMetadata = await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const targetData = participants.find(p => p.id === userToKick);
            const isTargetAdmin = targetData?.admin || targetData?.isSuperAdmin;

            if (isTargetAdmin) {
                return m.reply(`*${config.visuals.emoji2}* El objetivo posee privilegios de Administrador. No puedo procesar esta orden.\n\n> ¡Debes quitarle el rango primero si deseas expulsarlo!`);
            }

            // Ejecutar la expulsión en WhatsApp
            await conn.groupParticipantsUpdate(m.chat, [userToKick], 'remove');

            // Mensaje de éxito (Usando conn.sendMessage para que las menciones funcionen)
            await conn.sendMessage(m.chat, {
                text: `*${config.visuals.emoji3} \`PURGA COMPLETADA\` ${config.visuals.emoji3}*\n\nEl usuario @${userToKick.split('@')[0]} ha sido desterrado con éxito.\n\n> ¡El orden ha sido restaurado en el grupo!`,
                mentions: [userToKick]
            }, { quoted: m });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO KICK]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error inesperado al intentar ejecutar la expulsión.`);
        }
    }
};

export default kickCommand;
