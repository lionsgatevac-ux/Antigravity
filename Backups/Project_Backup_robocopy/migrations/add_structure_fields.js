const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function migrate() {
    try {
        console.log('Adding columns to properties table...');

        await pool.query(`
            ALTER TABLE properties 
            ADD COLUMN IF NOT EXISTS structure_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS structure_thickness INTEGER,
            ADD COLUMN IF NOT EXISTS unheated_space_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS unheated_space_area DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS unheated_space_name VARCHAR(100);
        `);

        console.log('✅ Columns added successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
