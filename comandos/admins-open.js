import { config } from '../config.js';

const openGroup = {
    name: 'open',
    alias: ['abrirgroup', 'abrir'],
    category: 'admins',
    desc: 'Abre el grupo para que todos los miembros puedan enviar mensajes libremente.',
    isAdmin: true,
    isGroup: true, // Asegura que solo se ejecute dentro de grupos
    noPrefix: true,

    run: async (conn, m) => {
        try {
            // Utilizamos tu función global para validar si el bot es admin
            const { isBotAdmin } = await conn.getAdminStatus(m.chat, m.sender);

            if (!isBotAdmin) {
                return m.reply(`*${config.visuals.emoji2}* El bot no posee rango de Administrador. No tengo poder para alterar los ajustes del grupo.\n\n> ¡Solicita el rango si deseas automatizar esta función!`);
            }

            const groupMetadata = await conn.groupMetadata(m.chat);

            if (!groupMetadata.announce) {
                return m.reply(`*${config.visuals.emoji2}* El grupo ya se encuentra abierto.\n\n> ¡No es necesario ejecutar la apertura de nuevo!`);
            }

            // Cambiar los ajustes del grupo a 'no_announcement' (todos pueden escribir)
            await conn.groupSettingUpdate(m.chat, 'not_announcement');

            await m.reply(`*${config.visuals.emoji3} \`GRUPO ABIERTO\` ${config.visuals.emoji3}*\n\nLa restricción ha sido levantada. Todos los miembros pueden enviar mensajes ahora.\n\n> ¡Mantengan el orden y respeten las reglas!`);

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO OPEN]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error inesperado al intentar abrir el grupo.`);
        }
    }
};

export default openGroup;
