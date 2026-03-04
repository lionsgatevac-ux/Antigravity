const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('🔄 Running migration: add_structure_fields...');

        await pool.query(`
            ALTER TABLE properties
            ADD COLUMN IF NOT EXISTS structure_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS structure_thickness INTEGER,
            ADD COLUMN IF NOT EXISTS unheated_space_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS unheated_space_area DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS unheated_space_name VARCHAR(255);
        `);

        console.log('✅ Structure fields added to properties table');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_properties_structure_type ON properties(structure_type);
        `);

        console.log('✅ Index created');
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();
