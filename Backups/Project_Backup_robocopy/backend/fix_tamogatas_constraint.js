const { query } = require('./config/database');

async function fixConstraint() {
    try {
        console.log('🔄 Updating database constraints...');

        // 1. Drop existing constraint
        await query(`
            ALTER TABLE documents 
            DROP CONSTRAINT IF EXISTS documents_document_type_check
        `);
        console.log('✅ Old constraint dropped.');

        // 2. Add new constraint with all types
        await query(`
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
        console.log('✅ New constraint added with "tamogatas_igenylo".');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating constraint:', err);
        process.exit(1);
    }
}

fixConstraint();
