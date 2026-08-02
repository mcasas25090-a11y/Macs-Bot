import { config } from '../config.js';
import { jidDecode } from '@whiskeysockets/baileys';

const inspectCommand = {
    name: 'inspect',
    alias: ['inspeccionar', 'revisar'],
    category: 'tools',
    desc: 'Extrae información detallada de enlaces de Grupos, Comunidades o Canales.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        const targetText = text || args[0];

        if (!targetText) {
            return m.reply(`*${config.visuals.emoji2}* Ingresa un enlace válido.\n\nEjemplo: ${usedPrefix}${commandName} https://whatsapp.com/channel/xxxx`);
        }

        const groupRegex = /chat\.whatsapp\.com\/(?:proxy\/)?([0-9A-Za-z]{20,24})/i;
        const channelRegex = /whatsapp\.com\/channel\/([0-9A-Za-z]{20,24})/i;

        try {
            if (channelRegex.test(targetText)) {
                const code = targetText.match(channelRegex)[1];

                let meta;
                try {
                    meta = await conn.newsletterMetadata('invite', code);
                } catch {
                    const res = await conn.query({
                        tag: 'iq',
                        attrs: { type: 'get', xmlns: 'w:mex', to: '@s.whatsapp.net' },
                        content: [{
                            tag: 'query',
                            attrs: { op: 'WAMXNewsletterInviteInfo' },
                            content: [{ tag: 'newsletter_invite', attrs: { code } }]
                        }]
                    });
                    const node = res.content[0].content[0];
                    meta = {
                        id: node.attrs.id,
                        name: node.attrs.name,
                        subscribers_count: node.attrs.subscribers_count,
                        description: node.attrs.description,
                        verification: node.attrs.verification
                    };
                }

                if (!meta) throw new Error();

                let txt = `*${config.visuals.emoji3} \`INSPECCIÓN DE CANAL\` ${config.visuals.emoji3}*\n\n`;
                txt += `📝 *Nombre:* ${meta.name || 'No disponible'}\n`;
                txt += `🆔 *ID:* ${meta.id}\n`;
                txt += `👥 *Suscriptores:* ${parseInt(meta.subscribers_count || 0).toLocaleString()}\n`;
                txt += `🛡️ *Verificado:* ${meta.verification === 'verified' ? 'Sí ✅' : 'No ❌'}\n\n`;
                txt += `📜 *Descripción:* ${meta.description || 'Sin descripción.'}\n\n`;
                txt += `> © Developed by Félix.`;

                return m.reply(txt);
            }

            if (groupRegex.test(targetText)) {
                const code = targetText.match(groupRegex)[1];
                const meta = await conn.groupGetInviteInfo(code);

                let txt = `*${config.visuals.emoji3} \`INSPECCIÓN DE GRUPO\` ${config.visuals.emoji3}*\n\n`;
                txt += `📝 *Nombre:* ${meta.subject}\n`;
                txt += `🆔 *ID:* ${meta.id}\n`;
                txt += `👑 *Creador:* @${meta.owner?.split('@')[0]}\n`;
                txt += `👥 *Miembros:* ${meta.size}\n`;
                txt += `🔗 *Vínculo:* ${meta.linkedParent ? 'Parte de una Comunidad' : 'Grupo Independiente'}\n`;
                txt += `🛡️ *Aprobación:* ${meta.joinApprovalMode ? 'Requerida' : 'Abierta'}\n\n`;
                txt += `📜 *Descripción:* ${meta.desc || 'Sin descripción.'}\n\n`;
                txt += `> © Developed by Félix.`;

                return conn.sendMessage(m.chat, { text: txt, mentions: [meta.owner] }, { quoted: m });
            }

            m.reply(`*${config.visuals.emoji2}* El enlace no es un destino válido.`);

        } catch (e) {
            m.reply(`*${config.visuals.emoji2}* Error al obtener datos. El enlace puede haber expirado o el canal es privado.`);
        }
    }
};

export default inspectCommand;