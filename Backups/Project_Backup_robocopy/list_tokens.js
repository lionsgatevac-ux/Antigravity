const { query } = require('./backend/config/database');

async function listTokens() {
    try {
        const result = await query(
            'SELECT p.id, p.full_name as customer_name, p.remote_signature_token, p.remote_signature_expires_at, p.updated_at FROM projects p JOIN customers c ON p.id = c.id WHERE p.remote_signature_token IS NOT NULL'
        );
        // Note: join might be wrong if id is shared or not. 
        // Actually projects.id is UUID, customers.id is UUID. They are linked via project_details.
        // But projects table has NO customer name directly? 
        // In `Project.findAll` (viewed earlier): 
        // SELECT p.*, c.full_name as customer_name FROM projects p LEFT JOIN project_details pd ON p.id = pd.project_id LEFT JOIN customers c ON pd.customer_id = c.id

        const sql = `
            SELECT p.id, c.full_name, p.remote_signature_token, p.remote_signature_expires_at, p.updated_at 
            FROM projects p 
            LEFT JOIN project_details pd ON p.id = pd.project_id 
            LEFT JOIN customers c ON pd.customer_id = c.id
            WHERE p.remote_signature_token IS NOT NULL
        `;

        const res = await query(sql);
        console.log('--- ACTIVE TOKENS ---');
        res.rows.forEach(row => {
            console.log(`Name: ${row.full_name}`);
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
