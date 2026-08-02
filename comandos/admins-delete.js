import { config } from '../config.js';

const deleteCommand = {
    name: 'del',
    alias: ['delete', 'borrar'],
    category: 'grupo',
    desc: 'Elimina el mensaje de otro usuario respondiendo a él.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m) => {
        try {
            if (!m.quoted) {
                return m.reply(`*${config.visuals.emoji2}* Por favor, responde al mensaje que deseas eliminar.`);
            }

            // Obtenemos los privilegios tanto del usuario como del bot
            const { isAdmin, isBotAdmin } = await conn.getAdminStatus(m.chat, m.sender);
            
            // Si el mensaje a borrar no fue enviado por el propio bot, validamos los permisos
            if (!m.quoted.key.fromMe) {
                if (!isAdmin) {
                    return m.reply(`*${config.visuals.emoji2}* Acceso denegado. Solo los administradores pueden usar este comando.`);
                }
                if (!isBotAdmin) {
                    return m.reply(`*${config.visuals.emoji2}* Permisos insuficientes. Necesito ser administrador del grupo para eliminar mensajes de otros usuarios.`);
                }
            }

            // Extraemos la key estructurada desde el handler de index.js
            const targetKey = m.quoted.key || {
                remoteJid: m.chat,
                fromMe: m.quoted.key?.fromMe || false,
                id: m.quoted.id,
                participant: m.quoted.key?.participant || m.quoted.sender
            };

            // Ejecutamos la eliminación
            await conn.sendMessage(m.chat, { delete: targetKey });

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO DEL]', e);
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error inesperado al intentar borrar el mensaje.`);
        }
    }
};

export default deleteCommand;
