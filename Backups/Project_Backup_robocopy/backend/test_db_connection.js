const { Pool } = require('pg');

const connectionString = 'postgres://postgres.pkjohziwbiiyzyospuot:Biznisz matek@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

console.log('Testing connection string:', connectionString);

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Connection Failed:', err);
    } else {
        console.log('✅ Connection Successful:', res.rows[0]);
    }
    pool.end();
});
