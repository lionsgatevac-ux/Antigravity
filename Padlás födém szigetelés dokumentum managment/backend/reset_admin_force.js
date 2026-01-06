const { Client } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function resetAdmin() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        const email = 'admin@bozso.hu';
        const rawPassword = 'password123';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 1. Get or Create Organization
        let orgId;
        const orgRes = await client.query('SELECT id FROM organizations LIMIT 1');
        if (orgRes.rows.length > 0) {
            orgId = orgRes.rows[0].id;
            console.log('Using existing organization ID:', orgId);
        } else {
            console.log('No organizations found. Creating one...');
            const newOrgRes = await client.query(
                "INSERT INTO organizations (name, created_at) VALUES ($1, NOW()) RETURNING id",
                ['BO-ZSO Default Org']
            );
            orgId = newOrgRes.rows[0].id;
            console.log('Created new organization ID:', orgId);
        }

        // 2. Create or Update User
        const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userRes.rows.length > 0) {
            console.log(`User ${email} found! Updating password...`);
            await client.query(
                'UPDATE users SET password_hash = $1, role = $2, organization_id = $3 WHERE email = $4',
                [hashedPassword, 'admin', orgId, email]
            );
            console.log('Password and organization updated successfully.');
        } else {
            console.log(`User ${email} NOT found! Creating...`);
            await client.query(
                'INSERT INTO users (email, password_hash, role, company_name, organization_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                [email, hashedPassword, 'admin', 'BO-ZSO Padlásfödém Szigetelés', orgId]
            );
            console.log('User created successfully.');
        }

    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await client.end();
    }
}

resetAdmin();
