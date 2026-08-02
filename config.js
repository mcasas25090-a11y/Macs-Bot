import fs from 'fs';
import path from 'path';

export const config = {
    botName: 'Macs Bot',
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
        // Añadimos un pequeño control de errores por si conn.user no está listo
        const userNumber = conn.user?.id?.split(':')[0] || ''; 
        const subBotPath = path.resolve(`./sesiones_subbots/${userNumber}`);
        const moodsPath = path.resolve(`./sesiones_moods/${userNumber}`);

        if (fs.existsSync(subBotPath)) return '*Sub-Bot*';
        if (fs.existsSync(moodsPath)) return '*Mood*';
        
        return '*Bot Principal*'; // Identidad principal
    },

    visuals: {
        line: '━',
        color: 'blue', 
        emoji: '🚀',
        emoji2: '✨',
        emoji3: '⚙️',
        emoji4: '💠',
        // Esta imagen se usará en los menús, puedes cambiar el link por un logo tuyo luego
        img1:  'https://upload.yotsuba.giize.com/u/Y9gwavKk.jpeg' 
    }
};
