console.log('Current working directory:', process.cwd());
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
}

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const resetUser = async () => {
    try {
        await client.connect();
        console.log('Connected to DB');

        const email = 'lionsgatevac@gmail.com'; // From screenshot
        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Check if user exists
        const checkRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (checkRes.rows.length === 0) {
            console.log(`User ${email} not found. Creating it...`);
            // Create the user if missing (should assume they are admin?)
            // We need an organization first? 
            // Let's assume organization exists or create one.

            // Get default organization or create
            let orgRes = await client.query('SELECT * FROM organizations LIMIT 1');
            let orgId;
            if (orgRes.rows.length === 0) {
                const orgInsert = await client.query("INSERT INTO organizations (name) VALUES ('Default Corp') RETURNING id");
                orgId = orgInsert.rows[0].id;
            } else {
                orgId = orgRes.rows[0].id;
            }

            await client.query(
                "INSERT INTO users (email, password_hash, full_name, role, organization_id) VALUES ($1, $2, $3, 'admin', $4)",
                [email, hashedPassword, 'Admin User', orgId]
            );
            console.log(`User created with password: ${newPassword}`);
        } else {
            console.log(`User found. Updating password...`);
            await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
            console.log(`Password updated to: ${newPassword}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
};

resetUser();
