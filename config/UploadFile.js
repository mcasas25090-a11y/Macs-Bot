import axios from 'axios';
import FormData from 'form-data';

export const uploadToYotsuba = async (buffer, mime) => {
    try {
        const ext = mime.split("/")[1] || "bin";
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const filename = `${id}.${ext}`;

        const form = new FormData();
        form.append('file', buffer, { 
            filename: filename,
            contentType: mime 
        });

        const response = await axios.post('https://upload.yotsuba.giize.com/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        return response.data.url; 
    } catch (error) {
        throw new Error('Fallo al subir archivo.');
    }
};