import { config } from '../config.js';

const demoteCommand = {
    name: 'demote',
    alias: ['quitaradmin', 'degradar'],
    category: 'admins',
    desc: 'Remueve los privilegios de administrador a un usuario mencionado o respondido.',
    isAdmin: true,
    isGroup: true, // Asegura que solo se ejecute en grupos
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Utilizamos tu función global para validar si el bot es admin
            const { isBotAdmin } = await conn.getAdminStatus(m.chat, m.sender);

            if (!isBotAdmin) {
                return m.reply(`*${config.visuals.emoji2}* El bot no posee rango de Administrador. No puedo revocar privilegios.\n\n> ¡Solicita el rango para gestionar la jerarquía!`);
            }

            // Captura de JID (Mención o Mensaje Respondido)
            let targetJid;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.quoted) {
                // Usamos la estructura m.quoted.sender que ya parseas en index.js
                targetJid = m.quoted.sender;
            }

            if (!targetJid) {
                return m.reply(`*${config.visuals.emoji2}* Debes mencionar a alguien o responder a su mensaje para ejecutar la degradación.\n\n> ¡Indica a quién debemos quitar el rango!`);
            }

            // Normalización de números
            const userToDemote = targetJid.split('@')[0].split(':')[0] + '@s.whatsapp.net';
            const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            
            // Extracción segura del número del owner
            const ownerRaw = typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0];
            const ownerNumber = ownerRaw.replace(/\D/g, '') + '@s.whatsapp.net';

            // Verificaciones de Seguridad (Anti-Rebelión)
            if (userToDemote === botNumber) {
                return m.reply(`*${config.visuals.emoji2}* No puedo degradarme a mí mismo. Mi propósito es servir, no autodestruirme.\n\n> ¡Acción cancelada por protocolo de seguridad!`);
            }

            if (userToDemote === ownerNumber) {
                return m.reply(`*${config.visuals.emoji2}* El Creador del bot posee una jerarquía absoluta. No puedes quitarle sus privilegios.\n\n> ¡Intento de rebelión detectado y bloqueado!`);
            }

            // Verificación del creador original del grupo
            const groupMetadata = await conn.groupMetadata(m.chat);
            const groupCreator = groupMetadata.owner || m.chat.split('-')[0] + '@s.whatsapp.net';

            if (userToDemote === groupCreator) {
                return m.reply(`*${config.visuals.emoji2}* No se puede degradar al dueño original del grupo. Su autoridad es raíz.\n\n> ¡No tengo permiso para tocar al Fundador!`);
            }

            // Verificar si el usuario realmente es administrador
            const participants = groupMetadata.participants;
            const targetData = participants.find(p => p.id === userToDemote);

            if (!targetData?.admin) {
                return m.reply(`*${config.visuals.emoji2}* El usuario seleccionado no es Administrador.\n\n> ¡No hay privilegios que revocar!`);
            }

            // Ejecutar la acción en WhatsApp
            await conn.groupParticipantsUpdate(m.chat, [userToDemote], 'demote');

            // Mensaje de éxito (Mencionando SÓLO al afectado, no a todos)
            await conn.sendMessage(m.chat, { 
                text: `*${config.visuals.emoji3} \`DEGRADACIÓN COMPLETADA\` ${config.visuals.emoji3}*\n\nEl usuario @${userToDemote.split('@')[0]} ha sido despojado de sus privilegios.\n\n> ¡El equilibrio ha sido restaurado!`,
                mentions: [userToDemote] // Corrección aplicada aquí
            }, { quoted: m });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO DEMOTE]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error interno al intentar ejecutar la degradación.`);
        }
    }
};

export default demoteCommand;
