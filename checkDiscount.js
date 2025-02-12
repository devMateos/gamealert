require("dotenv").config();
const nodemailer = require("nodemailer");

// 📌 Cargar la lista de usuarios desde .env
const USERS = JSON.parse(process.env.USERS_JSON);
const COUNTRY_CODE = process.env.COUNTRY_CODE || "es"; // 🇪🇸 País por defecto

// 🕵️‍♂️ Función para obtener datos del juego
async function getGameData(appId, countryCode) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${countryCode}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data[appId]?.data?.price_overview || null;
    } catch (error) {
        console.error("❌ Error al obtener datos de Steam:", error);
        return null;
    }
}

// 📩 Configurar Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 📩 Función para enviar el email
async function sendEmail(email, gameName, price, discount, appId) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `¡${gameName} tiene un ${discount}% de descuento en Steam!`,
        text: `El precio actual es ${price}. Compra aquí: https://store.steampowered.com/app/${appId}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📩 Email enviado a ${email} sobre ${gameName}`);
    } catch (error) {
        console.error(`❌ Error enviando email a ${email}:`, error);
    }
}

// 🎯 Función principal para revisar descuentos
async function checkDiscounts() {
    for (const user of USERS) {
        for (const game of user.games) {
            const gameData = await getGameData(game.appId, COUNTRY_CODE);

            if (!gameData) {
                console.log(`⚠️ No se pudo obtener el precio de ${game.name}`);
                continue;
            }

            const discount = gameData.discount_percent;
            if (discount >= game.minDiscount) {
                console.log(`✅ ${game.name} tiene un ${discount}% de descuento. Enviando alerta a ${user.email}...`);
                await sendEmail(user.email, game.name, gameData.final_formatted, discount, game.appId);
            } else {
                console.log(`⏳ ${game.name} tiene solo ${discount}% de descuento (se necesita al menos ${game.minDiscount}%).`);
            }
        }
    }
}

// 🚀 Ejecutar la función
checkDiscounts();
