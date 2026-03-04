const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'bozso_db',
    password: 'Biznisz matek',
    port: 5432,
});

const fs = require('fs');

async function getSettings() {
    try {
        const result = await pool.query("SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%' OR key = 'email_from'");
        let content = '';
        result.rows.forEach(row => {
            content += `${row.key}=${row.value}\n`;
        });
        fs.writeFileSync('temp_credentials.txt', content);
        console.log('Credentials written to temp_credentials.txt');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

getSettings();
