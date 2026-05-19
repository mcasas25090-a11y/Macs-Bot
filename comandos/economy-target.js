import fs from 'fs-extra';
import path from 'path';
import { config } from '../config.js';
import { database } from '../database.js';

const targetsFolder = path.resolve('./jsons/targets');

const claimCard = {
    name: 'target',
    alias: ['usartarjeta', 'tarjeta'],
    category: 'economy',
    desc: 'Reclama el saldo de una tarjeta de regalo mediante su código único.',
    isGroup: true,
    noPrefix: true,

    run: async (conn, m, { args }) => {
        try {
            const userJid = m.sender;
            const inputCode = args[0];

            if (!inputCode) {
                return m.reply(`*${config.visuals.emoji2}* \`Falta Código\`\n\nIngresa el código. Ejemplo: #target KZM-XXXX`);
            }

            await fs.ensureDir(targetsFolder);
            const cardPath = path.join(targetsFolder, `${inputCode}.json`);

            if (!await fs.pathExists(cardPath)) {
                return m.reply(`*${config.visuals.emoji2}* \`Código Inválido\`\n\nEsa tarjeta no existe o ya fue reclamada.`);
            }

            const cardData = await fs.readJson(cardPath);
            const monto = Number(cardData.monto);

            let userDb = await database.getUser(userJid);
            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: new Date(0).toISOString() };
            }

            userDb.bank = Number(userDb.bank || 0) + monto;

            await fs.remove(cardPath);
            await database.saveUser(userJid, userDb);

            let texto = `*${config.visuals.emoji3}* \`TARJETA RECLAMADA\` *${config.visuals.emoji3}*\n\n`;
            texto += `*❁* Código: \`${inputCode}\`\n`;
            texto += `*❁* Monto: \`¥${monto.toLocaleString()}\`\n\n`;
            texto += `> El dinero ha sido depositado en tu **Banco**.`;

            await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar la tarjeta.`);
        }
    }
};

export default claimCard;