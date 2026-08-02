import { config } from '../config.js';

const closeGroup = {
    name: 'close',
    alias: ['cerrargroup', 'cerrar'],
    category: 'admins',
    desc: 'Cierra el grupo para que solo los administradores puedan enviar mensajes.',
    isAdmin: true,
    isBotAdmin: true, // El handler (pixel.js) ahora verificará esto automáticamente
    isGroup: true,    // Evita que alguien intente usarlo al privado
    noPrefix: true,

    run: async (conn, m) => {
        try {
            const groupMetadata = await conn.groupMetadata(m.chat);

            // announce en true significa que solo admins pueden hablar
            if (groupMetadata.announce) {
                return m.reply(`*${config.visuals.emoji2} El grupo ya se encuentra cerrado.*\n\n> 🤫 El silencio ya impera en este chat.`);
            }

            // Ejecuta el cierre del grupo
            await conn.groupSettingUpdate(m.chat, 'announcement');

            // Confirmación de Macs Bot
            m.reply(`*${config.visuals.emoji3} \`GRUPO CERRADO\` ${config.visuals.emoji3}*\n\nSe ha activado el modo restrictivo. Solo los administradores pueden enviar mensajes a partir de ahora.\n\n> 🔒 *Canal de comunicación bloqueado.*`);
        } catch (e) {
            console.error('Error al cerrar el grupo:', e);
            m.reply(`❌ Ocurrió un error al intentar cerrar el grupo. Verifica mi conexión o permisos.`);
        }
    }
};

export default closeGroup;
