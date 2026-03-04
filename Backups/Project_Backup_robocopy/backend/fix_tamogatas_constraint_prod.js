const { Pool } = require('pg');

// Production credential
// Production credential - USING DIRECT IP because of DNS issues
const prodUrl = 'postgresql://postgres:Bizniszmatek@193.110.57.4:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

async function fixConstraint() {
    try {
        console.log('🔄 Updating PRODUCTION database constraints...');

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

        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating constraint:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixConstraint();
