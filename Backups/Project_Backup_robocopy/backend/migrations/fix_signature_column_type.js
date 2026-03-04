const { query } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('🔄 Migrating signature columns to TEXT type...');

        // Alter customer_signature_data
        await query(`
            ALTER TABLE projects 
            ALTER COLUMN customer_signature_data TYPE TEXT,
            ALTER COLUMN contractor_signature_data TYPE TEXT
        `);

        console.log('✅ Signature columns updated to TEXT successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating signature columns:', error);
        // If error is "column does not exist" or similar, we might want to ignore or handle
        // But for now, let's exit 1 so we see it in logs, or 0 if we want to proceed anyway?
        // Let's assume it should work if table exists.
        process.exit(1);
    }
};

runMigration();
