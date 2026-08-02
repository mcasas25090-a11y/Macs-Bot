#!/bin/bash

export DEBIAN_FRONTEND=noninteractive

clear
echo -e "\e[1;36m╔══════════════════════════════════╗\e[0m"
echo -e "\e[1;36m║ \e[1;37m🚀 MACS BOT - SISTEMA PRINCIPAL  \e[1;36m║\e[0m"
echo -e "\e[1;36m║ \e[1;36m💠 Instalador Universal Pro      \e[1;36m║\e[0m"
echo -e "\e[1;36m║ \e[1;34m💻 Pterodactyl • VPS • Termux    \e[1;36m║\e[0m"
echo -e "\e[1;36m╚══════════════════════════════════╝\e[0m"
echo ""

IS_TERMUX=false
if [[ $(command -v termux-setup-storage) ]]; then
    IS_TERMUX=true
    termux-setup-storage -y
    pkg install git nodejs ffmpeg libwebp build-essential python -y
fi

echo -e "\e[1;36m[🚀] Instalando módulos base de Macs Bot...\e[0m"
rm -rf node_modules package-lock.json

if [ "$IS_TERMUX" = true ]; then
    npm config set ignore-scripts true
    npm install --no-bin-links

    echo -e "\e[1;34m[⚙️] Aplicando parche de compatibilidad (Sharp) para Termux...\e[0m"

    FAKE_SHARP="const s = () => ({ toBuffer: () => Promise.resolve(Buffer.alloc(0)), resize: () => s(), webp: () => s(), png: () => s(), format: () => s() }); s.format = () => ({}); s.libvipsVersion = () => '0.0.0'; s.versions = { vips: '0.0.0' }; module.exports = s;"

    mkdir -p "./node_modules/sharp/lib"
    echo "$FAKE_SHARP" > "./node_modules/sharp/index.js"
    echo "$FAKE_SHARP" > "./node_modules/sharp/lib/sharp.js"

    mkdir -p "./node_modules/wa-sticker-formatter/node_modules/sharp/lib"
    echo "$FAKE_SHARP" > "./node_modules/wa-sticker-formatter/node_modules/sharp/index.js"
    echo "$FAKE_SHARP" > "./node_modules/wa-sticker-formatter/node_modules/sharp/lib/sharp.js"

    UTILITY_PATCH="module.exports = function() { return { vendorLibvips: '0.0.0', pkgConfigLibvips: '0.0.0' }; };"

    U1="./node_modules/sharp/lib/utility.js"
    U2="./node_modules/wa-sticker-formatter/node_modules/sharp/lib/utility.js"

    [ -f "$U1" ] && echo "$UTILITY_PATCH" > "$U1"
    [ -f "$U2" ] && echo "$UTILITY_PATCH" > "$U2"

    echo -e "\e[1;34m[⚙️] Compilando better-sqlite3 desde el código fuente (necesario en Termux ARM64)...\e[0m"
    if [ -d "./node_modules/better-sqlite3" ]; then
        (cd node_modules/better-sqlite3 && node-gyp rebuild --release) \
            && echo -e "\e[1;32m[✅] better-sqlite3 compilado correctamente.\e[0m" \
            || echo -e "\e[1;31m[❌] Falló la compilación de better-sqlite3. Puede que necesites instalar 'clang make python git' manualmente.\e[0m"
    fi
else
    npm install
fi

clear
echo -e "\e[1;32m[✨] ¡Instalación de Macs Bot completada! Iniciando sistema...\e[0m"
sleep 2
npm start