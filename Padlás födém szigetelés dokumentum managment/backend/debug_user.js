require('dotenv').config();
const { query } = require('./config/database');

async function debugUser() {
    try {
        console.log('Checking user admin@bozso.hu...');
        const email = 'admin@bozso.hu';

        // 1. Find by email
        const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log('User NOT FOUND by email.');
            return;
        }

        const user = userRes.rows[0];
        console.log('User FOUND by email:', user);
        console.log('User ID:', user.id);
        console.log('Type of ID:', typeof user.id);

        // 2. Find by ID (simulating middleware)
        const idRes = await query('SELECT * FROM users WHERE id = $1', [user.id]);
        if (idRes.rows.length === 0) {
            console.log('User NOT FOUND by ID! This is the issue.');
        } else {
            console.log('User FOUND by ID. Consistency check passed.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugUser();
