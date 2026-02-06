const { query } = require('./backend/config/database');

async function getToken() {
    try {
        const sql = `
            SELECT remote_signature_token 
            FROM projects 
            WHERE remote_signature_token IS NOT NULL 
            ORDER BY updated_at DESC 
            LIMIT 1
        `;
        const res = await query(sql);
        if (res.rows.length > 0) {
            console.log(res.rows[0].remote_signature_token);
        } else {
            console.log('NO_TOKEN');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

getToken();
