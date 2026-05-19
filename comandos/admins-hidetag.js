import { config } from '../config.js';

const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'notify'],
    category: 'admins',
    desc: 'Realiza una mención masiva invisible clonando el contenido enviado.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m, args) => {
        try {
            const { isAdmin } = await conn.getAdminStatus(m.chat, m.sender);
            if (!isAdmin) {
                return m.reply(`*${config.visuals.emoji2}* Solo los administradores pueden usar este comando.`);
            }

            const metadata = await conn.groupMetadata(m.chat).catch(() => null);
            if (!metadata) return;
            const participants = metadata.participants.map(p => p.id);

            const content = m.quoted ? m.quoted : m;

            const mime = content.mimetype || content.msg?.mimetype || '';
            const type = content.mtype || content.msg?.mtype || '';

            let options = { mentions: participants };
            let messageObject = {};

            if (m.quoted) {
                if (/image/.test(mime)) {
                    const media = await m.quoted.download().catch(() => null);
                    if (media) {
                        messageObject.image = media;
                        messageObject.caption = args.join(' ') || content.msg?.caption || '';
                    }
                } else if (/video/.test(mime)) {
                    const media = await m.quoted.download().catch(() => null);
                    if (media) {
                        messageObject.video = media;
                        messageObject.caption = args.join(' ') || content.msg?.caption || '';
                        if (content.msg?.gifPlayback) messageObject.gifPlayback = true;
                    }
                } else if (/sticker/.test(mime)) {
                    const media = await m.quoted.download().catch(() => null);
                    if (media) {
                        messageObject.sticker = media;
                    }
                } else if (/audio/.test(mime)) {
                    const media = await m.quoted.download().catch(() => null);
                    if (media) {
                        messageObject.audio = media;
                        messageObject.mimetype = mime;
                        messageObject.ptt = content.msg?.ptt || false;
                    }
                } else {
                    messageObject.text = args.join(' ') || m.quoted.text || '';
                }
            } else {
                if (!args.length) {
                    return m.reply(`*${config.visuals.emoji2}* Escribe un texto o responde a un archivo multimedia para usar la mención invisible.`);
                }
                messageObject.text = args.join(' ');
            }

            if (Object.keys(messageObject).length > 0) {
                await conn.sendMessage(m.chat, messageObject, options);
            } else {
                m.reply(`*${config.visuals.emoji2}* No se pudo clonar el contenido del mensaje.`);
            }

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Hubo un error al intentar procesar el hidetag.`);
        }
    }
};

export default hidetagCommand;