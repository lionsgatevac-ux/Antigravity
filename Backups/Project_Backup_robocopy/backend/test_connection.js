const { pool } = require('./config/database');

const main = async () => {
    try {
        console.log('Testing connection to:', pool.options ? pool.options.connectionString : 'unknown');
        const client = await pool.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('🕒 Server time:', res.rows[0]);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    }
};

main();
