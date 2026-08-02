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
                return m.reply(`*${config.visuals.emoji2}* Acceso denegado. Solo los administradores pueden usar este comando.`);
            }

            const metadata = await conn.groupMetadata(m.chat).catch(() => null);
            if (!metadata) return;
            
            // Extraer a todos los participantes para la mención masiva
            const participants = metadata.participants.map(p => p.id);

            const content = m.quoted ? m.quoted : m;

            // Uso de la estructura normalizada del index.js
            const mime = content.mimetype || content.msg?.mimetype || '';

            // En Baileys, 'mentions' va dentro del payload principal del mensaje
            let messageObject = { mentions: participants };

            if (m.quoted) {
                if (/image/.test(mime)) {
                    const media = await m.quoted.download().catch(() => null);
                    if (media) {
                        messageObject.image = media;
                        messageObject.caption = args.join(' ') || content.text || '';
                    }
                } else if (/video/.test(mime)) {
                    const media = await m.quoted.download().catch(() => null);
                    if (media) {
                        messageObject.video = media;
                        messageObject.caption = args.join(' ') || content.text || '';
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
                    // Para clonar mensajes de texto simples
                    messageObject.text = args.join(' ') || content.text || '';
                }
            } else {
                if (!args.length) {
                    return m.reply(`*${config.visuals.emoji2}* Escribe un texto o responde a un archivo multimedia para usar la mención invisible.`);
                }
                messageObject.text = args.join(' ');
            }

            // Validar que se haya agregado contenido (más allá del array de menciones)
            if (Object.keys(messageObject).length > 1) {
                await conn.sendMessage(m.chat, messageObject);
            } else {
                m.reply(`*${config.visuals.emoji2}* No se pudo clonar el contenido del mensaje. El formato no es compatible o la descarga falló.`);
            }

        } catch (e) {
            console.error('[❌ ERROR EN COMANDO HIDETAG]', e);
            m.reply(`*${config.visuals.emoji2}* Hubo un error inesperado al intentar procesar el hidetag.`);
        }
    }
};

export default hidetagCommand;
