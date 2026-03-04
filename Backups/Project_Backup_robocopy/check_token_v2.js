const { query } = require('./backend/config/database');

const token = '819e424231d7122f2c36245ffeb4e219ca9bbad1f431066a1df1b1fd72917a12';

async function checkToken() {
    try {
        console.log('--- CHECK STARTED ---');
        console.log('Looking for token:', token);

        // Check if token exists
        const result = await query(
            'SELECT id, remote_signature_token, remote_signature_expires_at FROM projects WHERE remote_signature_token = $1',
            [token]
        );

        if (result.rows.length > 0) {
            console.log('✅ Token FOUND.');
            console.log('Project ID:', result.rows[0].id);
            console.log('Expires:', result.rows[0].remote_signature_expires_at);
        } else {
            console.log('❌ Token NOT FOUND.');

            // Check if there are ANY tokens
            const allTokens = await query('SELECT count(*) as count FROM projects WHERE remote_signature_token IS NOT NULL');
            console.log('Total active tokens in DB:', allTokens.rows[0].count);

            // Check if the project might be signed (searching by recent updates?)
            // We can't know which project it was easily without the token, 
            // but we can list recently updated projects that are signed.
            const signedProjects = await query('SELECT id, updated_at FROM projects WHERE customer_signature_data IS NOT NULL ORDER BY updated_at DESC LIMIT 5');
            console.log('Recently signed projects:', signedProjects.rows);
        }
        console.log('--- CHECK FINISHED ---');
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        process.exit();
    }
}

checkToken();
