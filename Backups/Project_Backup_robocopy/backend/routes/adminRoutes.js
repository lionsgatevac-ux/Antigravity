const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const { sendEmail } = require('../services/emailService');

// Middleware to ensure user is admin
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
};

// GET /api/admin/settings/email
router.get('/settings/email', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT key, value FROM system_settings WHERE key IN ($1, $2, $3, $4, $5)',
            ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'email_from']);

        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        // Mask password for security
        if (settings.smtp_pass) {
            settings.smtp_pass = '********';
        }

        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error fetching email settings:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/admin/settings/email
router.post('/settings/email', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, email_from } = req.body;
        const userId = req.user.id;

        const updateSetting = async (key, value) => {
            // Basic upsert logic (PostgreSQL 9.5+ supports ON CONFLICT)
            // Using simple check-then-insert/update for compatibility or simpler logic here
            await query(`
                INSERT INTO system_settings (key, value, updated_by, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (key) DO UPDATE 
                SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
             `, [key, value, userId]);
        };

        if (smtp_host) await updateSetting('smtp_host', smtp_host);
        if (smtp_port) await updateSetting('smtp_port', smtp_port);
        if (smtp_user) await updateSetting('smtp_user', smtp_user);
        if (email_from) await updateSetting('email_from', email_from);

        // Only update password if provided (not masked)
        if (smtp_pass && smtp_pass !== '********') {
            await updateSetting('smtp_pass', smtp_pass);
        }

        res.json({ success: true, message: 'Email settings updated successfully' });

    } catch (err) {
        console.error('Error updating email settings:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/admin/settings/test-email
router.post('/settings/test-email', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { test_email } = req.body;
        if (!test_email) {
            return res.status(400).json({ success: false, error: 'Test email address is required' });
        }

        // Force reload of settings in emailService or pass context? 
        // For simplicity, emailService will reload settings on each send or we trigger a reload.
        // Actually, sendEmail in emailService will be updated to fetch fresh settings.

        const result = await sendEmail({
            to: test_email,
            subject: 'Test Email - Padlás Szigetelés',
            html: '<h1>Ez egy teszt email</h1><p>Ha ezt látod, az email rendszer működik! ✅</p>',
            text: 'Ez egy teszt email. Ha ezt látod, az email rendszer működik!'
        });

        if (result.success) {
            res.json({ success: true, message: 'Test email sent successfully', details: result });
        } else {
            res.status(500).json({ success: false, error: 'Failed to send test email', details: result.error });
        }

    } catch (err) {
        console.error('Error sending test email:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
