const { query } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Adding signature timestamp columns...');

        await query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS customer_signed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS contractor_signed_at TIMESTAMP
        `);

        console.log('✅ Signature timestamp columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding signature timestamp columns:', error);
        process.exit(1);
    }
};

runMigration();
