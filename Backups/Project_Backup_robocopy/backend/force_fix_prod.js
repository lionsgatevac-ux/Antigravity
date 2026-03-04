const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Production credential from check_prod_user.js
const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    try {
        console.log('📦 Starting Production Constraint Fix (using backup config)...');

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

    } catch (err) {
        console.error('❌ Fix failed:', err);
    } finally {
        await pool.end();
    }
}

fix();
