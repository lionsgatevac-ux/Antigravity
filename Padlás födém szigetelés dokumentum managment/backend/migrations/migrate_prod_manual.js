const { Pool } = require('pg');

const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

const createTable = async () => {
    const client = await pool.connect();
    try {
        console.log('🚧 Connecting to PROD DB to create system_settings table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by INTEGER -- REFERENCES users(id) elhagyható ha inkonzisztens
            );
        `);

        console.log('✅ PROD: system_settings table created successfully');

    } catch (err) {
        console.error('❌ PROD Error creating table:', err);
    } finally {
        client.release();
        pool.end();
    }
};

createTable();
