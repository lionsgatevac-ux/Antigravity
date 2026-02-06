const { query } = require('./backend/config/database');

const token = 'd8a62f72de2ac31e5ce9b7cdb41f40e5ab40b1d7e18186d36c0fda1930031576';

async function checkToken() {
    try {
        console.log('Checking token:', token);

        const result = await query(
            'SELECT id, remote_signature_token, remote_signature_expires_at, customer_signed_at, customer_signature_data FROM projects WHERE remote_signature_token = $1',
            [token]
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            console.log('✅ Token FOUND.');
            console.log('Project ID:', row.id);
            console.log('Expires:', row.remote_signature_expires_at);
            console.log('Signed At:', row.customer_signed_at);
            console.log('Signature Data Length:', row.customer_signature_data ? row.customer_signature_data.length : 0);
        } else {
            console.log('❌ Token NOT FOUND in DB.');

            // Check if there is ANY project with this token (maybe substring match?) - Unlikely for exact match query
            // Let's check the most recent project to see what ITS token is.
            const recent = await query('SELECT id, remote_signature_token FROM projects ORDER BY updated_at DESC LIMIT 1');
            if (recent.rows.length > 0) {
                console.log('Most recent project token:', recent.rows[0].remote_signature_token);
                console.log('Match?', recent.rows[0].remote_signature_token === token);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkToken();
