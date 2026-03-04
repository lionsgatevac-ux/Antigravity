const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

async function migrateAndFix() {
    try {
        console.log('🔌 Connecting to Prod DB...');
        const client = await pool.connect();

        // 1. Run Backup (Schema)
        try {
            const backupPath = path.join(__dirname, '..', 'database_backup.sql');
            console.log('📂 Reading backup:', backupPath);
            if (fs.existsSync(backupPath)) {
                const sql = fs.readFileSync(backupPath, 'utf8');
                console.log('🚀 Executing Backup Schema...');
                await client.query(sql);
                console.log('✅ Backup verification/execution done.');
            } else {
                console.error('❌ database_backup.sql NOT FOUND at', backupPath);
            }
        } catch (e) {
            console.error('⚠️ Error running backup SQL (might be duplicates):', e.message);
        }

        // 2. Run Migration 002
        try {
            const migPath = path.join(__dirname, '..', 'migrations', '002_add_signatures_to_projects.sql');
            console.log('📂 Reading migration 002:', migPath);
            if (fs.existsSync(migPath)) {
                const sql = fs.readFileSync(migPath, 'utf8');
                console.log('🚀 Executing Migration 002...');
                await client.query(sql);
                console.log('✅ Migration 002 done.');
            } else {
                console.log('ℹ️ Migration file 002 not found (optional).');
            }
        } catch (e) {
            console.error('⚠️ Error running migration 002 (might be already applied):', e.message);
        }

        // 3. Create/Reset Admin User
        console.log('👤 Ensuring Admin User...');
        const email = 'admin@bozso.hu';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check user
        // Note: Relation 'users' must exist now.
        const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            console.log('Creating Admin User/Org...');
            // Ensure org
            let orgId;
            const orgRes = await client.query("SELECT id FROM organizations WHERE name = 'Admin Org' LIMIT 1");
            if (orgRes.rows.length > 0) {
                orgId = orgRes.rows[0].id;
            } else {
                const newOrg = await client.query("INSERT INTO organizations (name) VALUES ('Admin Org') RETURNING id");
                orgId = newOrg.rows[0].id;
            }

            // Insert user
            await client.query(
                `INSERT INTO users (email, password_hash, role, full_name, organization_id) 
                 VALUES ($1, $2, 'admin', 'Admin User', $3)`,
                [email, hashedPassword, orgId]
            );
            console.log('✅ Admin user CREATED.');
        } else {
            console.log('User exists. Resetting password...');
            await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
            console.log('✅ Admin user password UPDATED.');
        }

        client.release();
    } catch (err) {
        console.error('❌ FATAL ERROR:', err);
    } finally {
        await pool.end();
    }
}

migrateAndFix();
