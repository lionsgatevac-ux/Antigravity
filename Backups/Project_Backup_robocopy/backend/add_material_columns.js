const { query } = require('./config/database');

async function addMaterialColumns() {
    try {
        await query(`
            ALTER TABLE project_details 
            ADD COLUMN IF NOT EXISTS insulation_type VARCHAR(100),
            ADD COLUMN IF NOT EXISTS foil_type VARCHAR(100);
        `);
        console.log('✅ Material columns added successfully');
    } catch (error) {
        console.error('❌ Error adding columns:', error);
    }
    process.exit(0);
}

addMaterialColumns();
