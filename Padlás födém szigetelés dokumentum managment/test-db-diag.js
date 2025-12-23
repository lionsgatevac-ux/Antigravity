require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function test() {
    console.log('Testing DB connection...');
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection OK:', res.rows[0]);

        console.log('Attempting INSERT into projects...');
        const uniqueId = Math.floor(Math.random() * 10000);
        const contract = `TEST-DIAG-${uniqueId}`;

        const insert = await pool.query(
            "INSERT INTO projects (contract_number, status) VALUES ($1, $2) RETURNING *",
            [contract, 'draft']
        );
        console.log('✅ Insert OK:', insert.rows[0]);

        console.log('Cleaning up...');
        await pool.query("DELETE FROM projects WHERE contract_number = $1", [contract]);
        console.log('✅ Cleanup OK');

    } catch (err) {
        console.error('❌ DB ERROR:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
    } finally {
        await pool.end();
    }
}

test();
