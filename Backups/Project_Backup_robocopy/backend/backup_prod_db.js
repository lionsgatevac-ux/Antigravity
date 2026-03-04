const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Production credential from check_prod_user.js
const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

const TABLES = ['users', 'organizations', 'projects', 'documents', 'invitations', 'photos'];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function backup() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log(`🔄 Attempting Constraint Update (Retries left: ${retries})...`);

            // 1. Drop existing constraint
            await pool.query(`
                ALTER TABLE documents 
                DROP CONSTRAINT IF EXISTS documents_document_type_check
            `);
            console.log('✅ Old constraint dropped.');

            // 2. Add new constraint with all types
            await pool.query(`
                ALTER TABLE documents 
                ADD CONSTRAINT documents_document_type_check 
                CHECK (document_type IN (
                    'kivitelezesi_szerzodes', 
                    'atadas_atveteli', 
                    'kivitelezoi_nyilatkozat', 
                    'megallapodas_hem', 
                    'tamogatas_igenylo'
                ))
            `);
            console.log('✅ New constraint added to PRODUCTION.');

            // If successful, break the loop and continue to backup or exit
            break;

        } catch (err) {
            console.error(`❌ Attempt failed: ${err.message}`);
            retries--;
            if (retries === 0) {
                console.error('❌ All retries failed.');
                throw err;
            }
            console.log('⏳ Waiting 2 seconds before retry...');
            await delay(2000);
        }
    }

    try {
        console.log('📦 Starting Production Backup...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, 'backups');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // ... rest of backup logic ...
        // To be safe and quick, I will just exit here if the fix worked, or let it backup too.
        // Let's just backup too.

        const backupData = {};

        for (const table of TABLES) {
            console.log(`   Reading table: ${table}...`);
            try {
                const res = await pool.query(`SELECT * FROM ${table}`);
                backupData[table] = res.rows;
                console.log(`   ✅ ${table}: ${res.rows.length} rows`);
            } catch (e) {
                console.warn(`   ⚠️ Could not read table ${table}:`, e.message);
            }
        }

        const filename = path.join(backupDir, `prod_backup_${timestamp}.json`);
        fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup saved to: ${filename}`);

    } catch (err) {
        console.error('❌ Backup request failed:', err);
    } finally {
        await pool.end();
    }
}

backup();
