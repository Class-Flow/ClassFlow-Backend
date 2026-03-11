const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
});

async function run() {
    try {
        console.log("Config:", process.env.EMAIL_USER, process.env.EMAIL_PASS);
        console.log("Attempting to send email...");
        const info = await transporter.sendMail({
            from: `"ClassFlow" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Test Email',
            text: 'Hello world'
        });
        console.log("Success:", info.response);
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
