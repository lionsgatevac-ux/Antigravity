const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');

        // Fetch FRESH user data from DB (to get latest organization_id etc.)
        const result = await query('SELECT id, email, role, organization_id FROM users WHERE id = $1', [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
        }

        // Attach fresh user to request
        req.user = result.rows[0];
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
