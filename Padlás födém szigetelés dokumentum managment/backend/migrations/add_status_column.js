const { query } = require('../config/database');

async function runMigration() {
    try {
        console.log('Adding status column to material_transactions...');

        // Add column if it doesn't exist
        await query(`
            ALTER TABLE material_transactions 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'COMPLETED';
        `);

        // Add check constraint (optional but good practice)
        // await query(`
        //     ALTER TABLE material_transactions 
        //     ADD CONSTRAINT check_status CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED'));
        // `);

        console.log('✅ Migration successful: status column added.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration();
