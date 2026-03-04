const { query } = require('./backend/config/database');

async function checkRecentProject() {
    try {
        const sql = `
            SELECT id, full_name, contract_number, 
                   LENGTH(customer_signature_data) as sig_len, 
                   customer_signed_at, 
                   updated_at,
                   remote_signature_token
            FROM projects 
            ORDER BY updated_at DESC 
            LIMIT 1
        `;

        const res = await query(sql);
        console.log('--- RECENT PROJECT ---');
        if (res.rows.length > 0) {
            const row = res.rows[0];
            console.log(`ID: ${row.id}`);
            console.log(`Name: ${row.full_name}`);
            console.log(`Signature Length: ${row.sig_len}`); // Should be > 0 if signed
            console.log(`Signed At: ${row.customer_signed_at}`);
            console.log(`Updated At: ${row.updated_at}`);
            console.log(`Token: ${row.remote_signature_token}`); // Should be null if signed
        } else {
            console.log('No projects found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkRecentProject();
