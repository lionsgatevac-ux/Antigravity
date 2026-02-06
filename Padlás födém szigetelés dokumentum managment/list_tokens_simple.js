const { query } = require('./backend/config/database');

async function listTokens() {
    try {
        const sql = `
            SELECT id, remote_signature_token, updated_at 
            FROM projects 
            WHERE remote_signature_token IS NOT NULL
        `;

        const res = await query(sql);
        console.log('--- ACTIVE TOKENS ---');
        res.rows.forEach(row => {
            console.log(`ID: ${row.id}`);
            console.log(`Token: ${row.remote_signature_token}`);
            console.log(`Updated: ${row.updated_at}`);
            console.log('-------------------');
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listTokens();
