import fs from 'fs';
import path from 'path';

export const config = {
    botName: 'Macs',
    currency: 'Coins',
    symbol: '¥',
    owner: [
        '51937424405@s.whatsapp.net', 
        '18495029889@s.whatsapp.net'
    ], 
    support: [
        '50557888080@s.whatsapp.net'
    ],
    prefix: '#',
    allPrefixes: ['#', '!', '.'],

    getBotType: (conn) => {
        const userNumber = conn.user.id.split(':')[0];
        const subBotPath = path.resolve(`./sesiones_subbots/${userNumber}`);
        const moodsPath = path.resolve(`./sesiones_moods/${userNumber}`);

        if (fs.existsSync(subBotPath)) return '*Sub-Bot*';
        if (fs.existsSync(moodsPath)) return '*Mood*';
        return '*Mood*';
    },

    visuals: {
        line: '━',
        color: 'magenta',
        emoji: '✰',
        emoji2: '❁',
        emoji3: '✿',
        emoji4: '❀',
        img1:  'https://upload.yotsuba.giize.com/u/Y9gwavKk.jpeg'
    },

    apiKzm: 'kzm-AkpQk-lKhaizmu',
    kzmUrl: 'rest.kazuma.giize.com'
};