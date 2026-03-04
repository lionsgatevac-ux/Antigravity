const { query } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Fixing documents check constraint...');

        // 1. Drop the existing constraint
        await query(`
            ALTER TABLE documents 
            DROP CONSTRAINT IF EXISTS documents_document_type_check
        `);

        // 2. Add the corrected constraint with ALL document types
        // types: kivitelezesi_szerzodes, atadas_atveteli, kivitelezoi_nyilatkozat, megallapodas_hem, tamogatas_igenylo
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

        console.log('✅ Constraint fixed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing constraint:', error);
        process.exit(1);
    }
};

runMigration();
