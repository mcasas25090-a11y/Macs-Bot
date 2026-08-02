import axios from 'axios';
import FormData from 'form-data';

export const uploadFile = async (buffer, mime) => {
    try {
        const ext = mime.split("/")[1] || "bin";
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let id = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        
        // Personalizamos el nombre del archivo para tu bot
        const filename = `macsbot_${id}.${ext}`; 

        const form = new FormData();
        form.append('reqtype', 'fileupload'); // Parámetro requerido por Catbox
        form.append('fileToUpload', buffer, { 
            filename: filename,
            contentType: mime 
        });

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        // Catbox devuelve la URL directamente como texto plano (ej: https://files.catbox.moe/xyz.jpg)
        return response.data; 
    } catch (error) {
        console.error('Error en uploadFile:', error.message);
        throw new Error('Fallo al subir archivo a la nube.');
    }
};
