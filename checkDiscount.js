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
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #171a21; padding: 20px; border-radius: 8px; color: white; text-align: center;">
                <h1 style="margin: 0;">¡Oferta en Steam! 🎮</h1>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h2 style="color: #171a21; margin-top: 0;">${gameName}</h2>
                <p style="font-size: 18px; color: #444;">
                    ¡Tiene un descuento del <span style="color: #66c0f4; font-weight: bold;">${discount}%</span>!
                </p>
                <p style="font-size: 20px; color: #171a21;">
                    Precio actual: <strong>${price}</strong>
                </p>
                <a href="https://store.steampowered.com/app/${appId}" 
                   style="display: inline-block; background-color: #66c0f4; color: white; padding: 12px 25px; 
                          text-decoration: none; border-radius: 4px; margin-top: 15px;">
                    Ver en Steam
                </a>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>Este es un email automático del sistema de alertas de videojuegos</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `¡${gameName} tiene un ${discount}% de descuento en Steam! 🎮`,
        html: htmlContent,
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
