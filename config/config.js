import fs from 'fs-extra';
import path from 'path';
import { config as mainConfig } from '../config.js';

export const getDynamicConfig = async (conn) => {
    // Verificamos que conn.user exista para evitar errores al inicio de sesión
    const botNumber = conn.user?.id?.split(':')[0].replace(/\D/g, '') || '';
    const subPath = path.resolve(`./sesiones_subbots/${botNumber}/settings.json`);
    const moodPath = path.resolve(`./sesiones_moods/${botNumber}/settings.json`);
    
    let displayBotName = mainConfig.botName;

    // Bloque try-catch para prevenir fallos si el JSON está mal formateado
    try {
        if (fs.existsSync(subPath)) {
            const localData = fs.readJsonSync(subPath);
            if (localData.shortName) displayBotName = localData.shortName;
        } else if (fs.existsSync(moodPath)) {
            const localData = fs.readJsonSync(moodPath);
            if (localData.shortName) displayBotName = localData.shortName;
        }
    } catch (error) {
        console.error('⚠️ Error leyendo la configuración dinámica:', error.message);
    }

    // Nueva identidad de Macs Bot sin enlaces a la antigua API
    return {
        stickers: {
            packname: `🚀   ${mainConfig.botName.toUpperCase()}   🚀\n➪ Creado con tecnología avanzada.\n\n  💠 Prefix » [ ${mainConfig.prefix} ]`,
            packauthor: `✨ Bot »\n💠 ${displayBotName}\n \n      👤 Usuario »\n  🌟 @(userName)`
        }
    };
};
