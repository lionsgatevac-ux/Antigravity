const { sendEmail } = require('./backend/services/emailService');

async function run() {
    try {
        console.log('--- SENDING TEST EMAIL ---');
        const result = await sendEmail({
            to: 'lionsgatevac@gmail.com',
            subject: 'Test Email from Debugger',
            html: '<p>This is a test email to verify SMTP settings and internet connection.</p>',
            text: 'This is a test email to verify SMTP settings and internet connection.'
        });

        console.log('Result:', result);
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        // give it a moment to flush buffers if any
        setTimeout(() => process.exit(), 1000);
    }
}

run();
