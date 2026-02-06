const { query } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Ensuring signature columns exist...');

        // Add columns if they don't exist
        await query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS customer_signature_data TEXT,
            ADD COLUMN IF NOT EXISTS contractor_signature_data TEXT,
            ADD COLUMN IF NOT EXISTS customer_signed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS contractor_signed_at TIMESTAMP
        `);

        console.log('✅ Signature columns ensured.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ensuring signature columns:', error);
        process.exit(1);
    }
};

runMigration();
