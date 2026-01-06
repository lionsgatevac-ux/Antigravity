try {
    const nodemailer = require('nodemailer');
    console.log('✅ Nodemailer loaded successfully');

    // Test creating generic transporter (not sending)
    const transporter = nodemailer.createTransport({
        jsonTransport: true
    });
    console.log('✅ Transporter created');

    const bcrypt = require('bcrypt');
    console.log('✅ Bcrypt loaded');

    const jwt = require('jsonwebtoken');
    console.log('✅ JWT loaded');

} catch (err) {
    console.error('❌ Dependency missing:', err.message);
    process.exit(1);
}
