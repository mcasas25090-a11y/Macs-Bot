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
                return m.reply(`*${config.visuals.emoji2}* Responde al mensaje que deseas eliminar.`);
            }

            const { isAdmin } = await conn.getAdminStatus(m.chat, m.sender);
            if (!isAdmin) {
                return m.reply(`*${config.visuals.emoji2}* Solo los administradores pueden usar este comando.`);
            }

            const targetKey = m.quoted.vM?.key || {
                remoteJid: m.chat,
                fromMe: m.quoted.fromMe,
                id: m.quoted.id,
                participant: m.quoted.sender
            };

            await conn.sendMessage(m.chat, { delete: targetKey });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al intentar borrar el mensaje. Asegúrate de que el bot sea administrador.`);
        }
    }
};

export default deleteCommand;