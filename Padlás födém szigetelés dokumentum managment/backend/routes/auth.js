const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For token generation
const { query, transaction } = require('../config/database');
const { sendInvitation, sendPasswordReset } = require('../services/emailService');
const authMiddleware = require('../middleware/authMiddleware');

// === HELPER: Generate Token ===
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email, organization_id: user.organization_id },
        process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
        { expiresIn: '30d' }
    );
};

// === 1. REGISTER (External / Main Admin) ===
// Creates a new Organization and an Admin User for it
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            // role is ignored here, defaulted to 'admin' for new signups (External)
            full_name,
            company_name,
            company_address,
            company_tax_number,
            company_reg_number
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Check if user exists
        const existingInfo = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingInfo.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        const result = await transaction(async (client) => {
            // 1. Create Organization
            // Uses company_name or fallback
            const orgName = company_name || `${full_name}'s Organization`;
            const orgRes = await client.query(
                'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
                [orgName]
            );
            const orgId = orgRes.rows[0].id;

            // 2. Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // 3. Create User (Admin Role)
            const userRes = await client.query(
                `INSERT INTO users (
                    email, password_hash, role, full_name, 
                    company_name, company_address, company_tax_number, company_reg_number,
                    organization_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, role, full_name, company_name, organization_id`,
                [
                    email,
                    password_hash,
                    'admin', // External signups are Admins of their own Org
                    full_name,
                    company_name,
                    company_address,
                    company_tax_number,
                    company_reg_number,
                    orgId
                ]
            );
            const user = userRes.rows[0];

            // 4. Set owner_id for Organization (optional, but good for tracking)
            await client.query('UPDATE organizations SET owner_id = $1 WHERE id = $2', [user.id, orgId]);

            return user;
        });

        // Create Token
        const token = generateToken(result);

        res.status(201).json({
            success: true,
            data: { token, user: result }
        });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
});

// === 2. LOGIN ===
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[LOGIN ATTEMPT] Email: ${email}`);

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log('[LOGIN FAIL] User not found');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`[LOGIN DEBUG] Password match: ${isMatch}`);

        if (!isMatch) {
            console.log('[LOGIN FAIL] Password mismatch');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate Token with org_id
        const token = generateToken(user);
        delete user.password_hash;
        console.log(`[LOGIN SUCCESS] User: ${user.id}`);

        res.json({
            success: true,
            data: { token, user }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

// === 3. INVITE USER (Admin Only) ===
router.post('/invite', authMiddleware, async (req, res) => {
    try {
        // Only Admin can invite
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Only admins can invite users' });
        }

        const { email, role, full_name } = req.body;
        // Default to 'contractor' if not specified, limit to distinct roles
        const targetRole = ['admin', 'contractor'].includes(role) ? role : 'contractor';

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Check if user already exists
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'User already registered' });
        }

        // Check pending invitations
        const inviteCheck = await query('SELECT id FROM invitations WHERE email = $1 AND status = \'pending\'', [email]);
        if (inviteCheck.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Invitation already pending for this email' });
        }

        // Generate Invite Token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Get Org Name for email
        const orgRes = await query('SELECT name FROM organizations WHERE id = $1', [req.user.organization_id]);
        const orgName = orgRes.rows[0]?.name || 'Organization';

        // Insert Invitation
        await query(
            `INSERT INTO invitations (email, organization_id, role, token, expires_at, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [email, req.user.organization_id, targetRole, inviteToken, expiresAt]
        );

        // Send Email
        const emailResult = await sendInvitation(email, inviteToken, orgName, targetRole);

        if (!emailResult.success) {
            return res.status(500).json({ success: false, error: 'Failed to send invitation email', details: emailResult.error });
        }

        res.json({
            success: true,
            message: 'Invitation sent successfully',
            previewUrl: emailResult.previewUrl // Ethereal link for dev
        });

    } catch (err) {
        console.error('Invite Error:', err);
        res.status(500).json({ success: false, error: 'Server error during invitation' });
    }
});

// === 4. ACCEPT INVITE (Public) ===
// Validates token + registers user
router.post('/accept-invite', async (req, res) => {
    try {
        const { token, password, full_name, company_name } = req.body; // User converts invite to account

        if (!token || !password) {
            return res.status(400).json({ success: false, error: 'Token and password are required' });
        }

        // Find Invitation
        const inviteRes = await query(
            'SELECT * FROM invitations WHERE token = $1 AND status = \'pending\' AND expires_at > NOW()',
            [token]
        );

        if (inviteRes.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid or expired invitation token' });
        }

        const invite = inviteRes.rows[0];

        const result = await transaction(async (client) => {
            // 1. Hash Password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // 2. Create User
            const userRes = await client.query(
                `INSERT INTO users (
                    email, password_hash, role, full_name, 
                    company_name, organization_id
                ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, full_name`,
                [
                    invite.email,
                    password_hash,
                    invite.role,
                    full_name || '',
                    company_name || '',
                    invite.organization_id
                ]
            );

            // 3. Update Invitation Status
            await client.query('UPDATE invitations SET status = \'accepted\' WHERE id = $1', [invite.id]);

            return userRes.rows[0];
        });

        // 4. Generate Token (Auto Login)
        // Need organization_id context
        result.organization_id = invite.organization_id;
        const jwtToken = generateToken(result);

        res.json({
            success: true,
            data: {
                token: jwtToken,
                user: result
            }
        });

    } catch (err) {
        console.error('Accept Invite Error:', err);
        res.status(500).json({ success: false, error: 'Server error accepting invitation' });
    }
});

// === 5. GET ME (Verify Token) ===
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userRes = await query('SELECT id, email, role, full_name, company_name, organization_id FROM users WHERE id = $1', [req.user.id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: { user: userRes.rows[0] } });
    } catch (err) {
        console.error('Me Error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
