const { query } = require('./backend/config/database');

async function checkSettings() {
    try {
        const result = await query('SELECT key, value FROM system_settings WHERE key LIKE \'smtp_%\' OR key = \'email_from\'');
        console.log('--- SMTP SETTINGS (Masked) ---');
        result.rows.forEach(row => {
            if (row.key === 'smtp_pass') {
                console.log(`${row.key}: ${row.value ? '***' + row.value.slice(-3) : 'NULL'}`);
            } else {
                console.log(`${row.key}: ${row.value}`);
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSettings();
