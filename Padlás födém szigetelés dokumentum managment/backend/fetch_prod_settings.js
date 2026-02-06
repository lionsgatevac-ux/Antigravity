const { Pool } = require('pg');

const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

async function fetchSettings() {
    try {
        console.log('Connecting to Prod DB...');
        const res = await pool.query("SELECT key, value FROM system_settings WHERE key IN ('smtp_user', 'smtp_pass', 'email_from', 'smtp_host', 'smtp_port', 'smtp_secure')");

        const settings = {};
        res.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        console.log('Fetched Settings:', settings);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fetchSettings();
