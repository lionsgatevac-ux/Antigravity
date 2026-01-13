const { pool } = require('../config/database');

const createTable = async () => {
    const client = await pool.connect();
    try {
        console.log('🚧 Creating system_settings table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by INTEGER REFERENCES users(id) -- Opcionális, ha logolni akarjuk ki módosította
            );
        `);

        console.log('✅ system_settings table created successfully');

        // Insert default values if not exists (optional)
        // const defaults = {
        //     'smtp_host': 'smtp.gmail.com',
        //     'smtp_port': '587'
        // };
        // ... insertion logic

    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        client.release();
        pool.end();
    }
};

createTable();
