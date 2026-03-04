const { Pool } = require('pg');

const connectionString = 'postgres://postgres:Biznisz matek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

console.log('Testing connection string:', connectionString);

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase usually
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Connection Failed:', err);
    } else {
        console.log('✅ Connection Successful:', res.rows[0]);
    }
    pool.end();
});
