const { Pool } = require('pg');

// Production DB Connection String
const connectionString = "postgresql://postgres.pkjohziwbiiyzyospuot:BizniszMatek2024@aws-1-eu-central-1.pooler.supabase.com:6543/postgres";

async function runMigration() {
    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Running migration: add heating_type column...');

        await pool.query(`
            ALTER TABLE properties
            ADD COLUMN IF NOT EXISTS heating_type VARCHAR(255);
        `);

        console.log('✅ heating_type column added to properties table');
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', JSON.stringify(error, null, 2));
        console.error(error.message); // Also log message directly
        console.error(error.stack);   // And stack try
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();
