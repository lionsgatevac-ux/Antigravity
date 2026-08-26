const { query } = require('../config/database');

async function runMigration() {
    try {
        console.log('Adding quantity column to material_transactions...');

        // Add column
        await query(`
            ALTER TABLE material_transactions 
            ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
        `);

        // Populate existing rows (ABS of quantity_change)
        await query(`
            UPDATE material_transactions 
            SET quantity = ABS(quantity_change) 
            WHERE quantity = 0;
        `);

        console.log('✅ Migration successful: quantity column added and populated.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration();
