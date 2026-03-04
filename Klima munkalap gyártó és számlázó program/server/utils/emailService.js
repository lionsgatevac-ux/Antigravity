const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../data/settings.json');

const getSettings = () => {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) return {};
        const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
        return JSON.parse(data).smtp || {};
    } catch (err) {
        console.error('Error reading settings:', err);
        return {};
    }
};

const sendEmail = async ({ to, subject, text, html, attachments }) => {
    const settings = getSettings();

    if (!settings.host || !settings.user || !settings.pass) {
        throw new Error('SMTP beállítások hiányoznak a settings.json fájlból.');
    }

    const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port || 587,
        secure: settings.secure || false, // true for 465, false for other ports
        auth: {
            user: settings.user,
            pass: settings.pass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: settings.from || settings.user,
            to,
            subject,
            text,
            html,
            attachments,
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
