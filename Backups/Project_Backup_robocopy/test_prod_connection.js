const { Pool } = require('pg');

// Candidate 1: From config/database.js (No space)
const url1 = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

// Candidate 2: With space (Common in this project)
const url2 = 'postgresql://postgres:Biznisz%20matek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

async function testConnection(connectionString, label) {
    console.log(`Testing ${label}...`);
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        console.log(`✅ ${label} Success! Time:`, res.rows[0].now);
        client.release();
        return true;
    } catch (err) {
        console.error(`❌ ${label} Failed:`, err.message);
        return false;
    } finally {
        await pool.end();
    }
}

async function run() {
    await testConnection(url1, 'Config Hardcoded (No space)');
    await testConnection(url2, 'Alternative (With space)');
}

run();
