const nodemailer = require('nodemailer');
const { query } = require('../config/database');

// Current transporter instance
let transporter = null;
let currentConfig = null;

const getSettings = async () => {
    try {
        const result = await query('SELECT key, value FROM system_settings WHERE key IN ($1, $2, $3, $4, $5)',
            ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure']);

        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    } catch (error) {
        console.error('❌ Error fetching email settings:', error);
        return {};
    }
};

const getTransporter = async () => {
    const dbSettings = await getSettings();

    // Check if we have enough DB settings
    if (dbSettings.smtp_host && dbSettings.smtp_user) {
        const newConfigConfigStr = JSON.stringify(dbSettings);

        // If config changed or no transporter, create new one
        if (!transporter || currentConfig !== newConfigConfigStr) {
            console.log('📧 EmailService: Initializing transporter from Database settings...');
            transporter = nodemailer.createTransport({
                host: dbSettings.smtp_host,
                port: parseInt(dbSettings.smtp_port) || 587,
                secure: dbSettings.smtp_secure === 'true', // true for 465, false for other ports
                auth: {
                    user: dbSettings.smtp_user,
                    pass: dbSettings.smtp_pass,
                },
            });
            currentConfig = newConfigConfigStr;
        }
        return transporter;
    }

    // Fallback to Env Vars
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        if (!transporter) {
            console.log('📧 EmailService: Using Environment Variables for SMTP...');
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        return transporter;
    }

    // Fallback to Ethereal
    if (!transporter) {
        console.log('📧 EmailService: No settings found, creating Ethereal test account...');
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('📧 EmailService: Ethereal Account Created:', testAccount.user);
        } catch (err) {
            console.error('❌ EmailService: Failed to create Ethereal account', err);
            return null;
        }
    }
    return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transport = await getTransporter();

        if (!transport) {
            throw new Error('Email transporter not initialized');
        }

        const dbSettings = await getSettings();
        const fromAddress = dbSettings.email_from || process.env.EMAIL_FROM || '"Padlás Szigetelés" <noreply@padlasszigeteles.hu>';

        const info = await transport.sendMail({
            from: fromAddress,
            to,
            subject,
            text, // plain text body
            html, // html body
        });

        console.log("📨 Email sent: %s", info.messageId);

        // Preview only available when sending through an Ethereal account
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("🔗 Preview URL: %s", previewUrl);
        }

        return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

const sendInvitation = async (email, token, organizationName, userRole) => {
    // TODO: Frontend URL from env or db
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

    const html = `
        <h1>Meghívás a(z) ${organizationName} rendszerébe</h1>
        <p>Önt meghívták, hogy csatlakozzon a(z) <strong>${organizationName}</strong> csapathoz mint <strong>${userRole === 'admin' ? 'Adminisztrátor' : 'Alvállalkozó'}</strong>.</p>
        <p>A regisztráció befejezéséhez kattintson az alábbi linkre:</p>
        <a href="${inviteLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Csatlakozás</a>
        <p>Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:</p>
        <p>${inviteLink}</p>
        <p>Ez a meghívó 7 napig érvényes.</p>
    `;

    return sendEmail({
        to: email,
        subject: `Meghívás - ${organizationName}`,
        html,
        text: `Meghívás a(z) ${organizationName} rendszerébe. Link: ${inviteLink}`
    });
};

const sendPasswordReset = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
        <h1>Jelszóemlékeztető</h1>
        <p>Ön jelszó-visszaállítást kért.</p>
        <p>Kattintson az alábbi linkre új jelszó megadásához:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #008CBA; color: white; text-decoration: none; border-radius: 5px;">Jelszó visszaállítása</a>
        <p>Ha nem Ön kérte ezt, hagyja figyelmen kívül ezt az emailt.</p>
    `;

    return sendEmail({
        to: email,
        subject: 'Jelszóemlékeztető - Padlás Szigetelés',
        html,
        text: `Jelszóemlékeztető link: ${resetLink}`
    });
};

module.exports = {
    sendInvitation,
    sendPasswordReset,
    sendEmail // Export generic sender for testing
};
