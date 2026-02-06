const { query } = require('./backend/config/database');

async function getLatestToken() {
    try {
        const sql = `
            SELECT id, remote_signature_token, updated_at, remote_signature_expires_at 
            FROM projects 
            WHERE remote_signature_token IS NOT NULL 
            ORDER BY updated_at DESC 
            LIMIT 1
        `;

        const res = await query(sql);
        console.log('--- LATEST TOKEN ---');
        if (res.rows.length > 0) {
            const row = res.rows[0];
            console.log(`ID: ${row.id}`);
            console.log(`Token: ${row.remote_signature_token}`);
            console.log(`Updated: ${row.updated_at}`);
            console.log(`Expires: ${row.remote_signature_expires_at}`);
        } else {
            console.log('No active tokens found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

getLatestToken();
