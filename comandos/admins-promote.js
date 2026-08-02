import { config } from '../config.js';

const promoteCommand = {
    name: 'promote',
    alias: ['daradmin', 'promover'],
    category: 'admins',
    desc: 'Otorga privilegios de administrador a un usuario mencionado o respondido.',
    isAdmin: true,
    isGroup: true, // Asegura que solo se ejecute dentro de grupos
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Utilizamos tu función global para validar si el bot es admin
            const { isBotAdmin } = await conn.getAdminStatus(m.chat, m.sender);

            if (!isBotAdmin) {
                return m.reply(`*${config.visuals.emoji2}* El bot no posee rango de Administrador. No puedo otorgar privilegios a otros miembros.\n\n> ¡Solicita el rango si deseas automatizar esta función!`);
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
                return m.reply(`*${config.visuals.emoji2}* Debes mencionar a alguien o responder a su mensaje para otorgar el ascenso.\n\n> ¡Indica quién será el nuevo Administrador!`);
            }

            // Normalización del JID
            const userToPromote = targetJid.split('@')[0].split(':')[0] + '@s.whatsapp.net';
            
            const groupMetadata = await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const targetData = participants.find(p => p.id === userToPromote);

            if (targetData?.admin) {
                return m.reply(`*${config.visuals.emoji2}* El usuario seleccionado ya posee el rango de Administrador.\n\n> ¡No es necesario promoverlo de nuevo!`);
            }

            // Ejecutar el ascenso en WhatsApp
            await conn.groupParticipantsUpdate(m.chat, [userToPromote], 'promote');

            // Mensaje de éxito (Mencionando SÓLO al usuario ascendido, no a todo el grupo)
            await conn.sendMessage(m.chat, { 
                text: `*${config.visuals.emoji3} \`ASCENSO COMPLETADO\` ${config.visuals.emoji3}*\n\nEl usuario @${userToPromote.split('@')[0]} ahora forma parte de la jerarquía de Administradores.\n\n> ¡Un nuevo poder ha sido otorgado!`,
                mentions: [userToPromote]
            }, { quoted: m });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO PROMOTE]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error inesperado al intentar ejecutar el ascenso.`);
        }
    }
};

export default promoteCommand;
