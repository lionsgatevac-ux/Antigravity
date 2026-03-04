const { query } = require('./backend/config/database');

const token = '1270c1b6cf6a50d1c24692054faadc51ad1bf56d58de7fd53264afd67df2c892';
const dummySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function run() {
    try {
        console.log('--- SIMULATING UPDATE ---');

        // 1. Find project
        const findRes = await query('SELECT id FROM projects WHERE remote_signature_token = $1', [token]);
        if (findRes.rows.length === 0) {
            console.log('❌ Project not found by token.');
            return;
        }
        const projectId = findRes.rows[0].id;
        console.log(`✅ Project found. ID: ${projectId}`);

        // 2. Run Update
        console.log('Attempting UPDATE...');
        const result = await query(
            'UPDATE projects SET customer_signature_data = $1, customer_signed_at = NOW(), updated_at = NOW(), remote_signature_token = NULL WHERE id = $2',
            [dummySignature, projectId]
        );

        console.log(`Update Result: ${result.rowCount} rows updated.`);

        if (result.rowCount === 1) {
            console.log('✅ SUCCESS: DB Update works manually.');
        } else {
            console.log('❌ FAILURE: DB Update returned 0 rows.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();
