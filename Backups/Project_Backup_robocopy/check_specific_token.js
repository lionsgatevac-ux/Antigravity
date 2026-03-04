const { query } = require('./backend/config/database');

const token = '819e424231d7122f2c36245ffeb4e219ca9bbad1f431066a1df1b1fd72917a12';

async function checkToken() {
    try {
        console.log('🔍 Checking token:', token);
        const result = await query(
            'SELECT id, remote_signature_token, remote_signature_expires_at, customer_signature_data FROM projects WHERE remote_signature_token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            console.log('❌ Token NOT found in database.');

            // Debug: List all tokens
            const allTokens = await query('SELECT id, remote_signature_token FROM projects WHERE remote_signature_token IS NOT NULL');
            console.log('Tokens in DB:', allTokens.rows);
        } else {
            const project = result.rows[0];
            console.log('✅ Token FOUND for project ID:', project.id);
            console.log('Expires at:', project.remote_signature_expires_at);
            console.log('Is Expired?', new Date(project.remote_signature_expires_at) <= new Date());
            console.log('Has Signature?', !!project.customer_signature_data);
        }
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        process.exit();
    }
}

checkToken();
