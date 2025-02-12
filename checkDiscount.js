require("dotenv").config();
const nodemailer = require("nodemailer");
const cron = require("node-cron");



// Configuración
const APP_ID = 553850; // Helldivers II
const COUNTRY_CODE = "es"; // España (ajustar según región)
const DISCOUNT_THRESHOLD = 10; // % de descuento deseado

// Función para obtener datos del juego
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


// Configurar Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Tu correo
        pass: process.env.EMAIL_PASS, // Contraseña o App Password
    },
});

// Función para enviar el email
async function sendEmail(gameName, price, discount) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL, // Correo al que quieres enviar la alerta
        subject: `¡${gameName} tiene un ${discount}% de descuento en Steam!`,
        text: `El precio actual es ${price}. Compra aquí: https://store.steampowered.com/app/${APP_ID}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("📩 Email enviado con éxito.");
    } catch (error) {
        console.error("❌ Error enviando el email:", error);
    }
}

// Función principal
async function checkDiscount() {
    const gameData = await getGameData(APP_ID, COUNTRY_CODE);

    if (!gameData) {
        console.log("No se pudo obtener el precio del juego.");
        return;
    }

    const discount = gameData.discount_percent;
    if (discount >= DISCOUNT_THRESHOLD) {
        console.log(`✅ ¡Descuento del ${discount}% detectado! Enviando alerta...`);
        await sendEmail("Helldivers II", gameData.final_formatted, discount);
    } else {
        console.log(`⏳ Aún no hay descuento del ${DISCOUNT_THRESHOLD}% (actual: ${discount}%).`);
    }
}

// Ejecutar cada 30 minutos
checkDiscount()
