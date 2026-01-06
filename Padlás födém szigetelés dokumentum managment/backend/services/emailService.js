const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
const createTransporter = async () => {
    // Check if we have production credentials
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Fallback to Ethereal for development
    console.log('📧 EmailService: SMTP credentials missing, creating Ethereal test account...');
    try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        console.log('📧 EmailService: Ethereal Account Created:', testAccount.user);
        return transporter;
    } catch (err) {
        console.error('❌ EmailService: Failed to create Ethereal account', err);
        return null;
    }
};

let transporterPromise = createTransporter();

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = await transporterPromise;

        if (!transporter) {
            throw new Error('Email transporter not initialized');
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Padlás Szigetelés" <noreply@padlasszigeteles.hu>',
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
    // TODO: Frontend URL from env
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
    sendPasswordReset
};
