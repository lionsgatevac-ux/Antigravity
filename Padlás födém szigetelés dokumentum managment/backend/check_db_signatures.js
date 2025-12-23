const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSignatureData() {
    try {
        // Get latest project with signature data
        const result = await pool.query(`
            SELECT id, contract_number, 
                   LENGTH(customer_signature_data) as customer_sig_length,
                   LENGTH(contractor_signature_data) as contractor_sig_length,
                   SUBSTRING(customer_signature_data, 1, 50) as customer_sig_preview,
                   SUBSTRING(contractor_signature_data, 1, 50) as contractor_sig_preview
            FROM projects 
            WHERE contract_number LIKE 'BOZSO-2025-%'
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log('=== SIGNATURE DATA IN DATABASE ===\n');
        result.rows.forEach(row => {
            console.log(`Project: ${row.contract_number}`);
            console.log(`  Customer sig: ${row.customer_sig_length ? row.customer_sig_length + ' chars' : 'NULL/EMPTY'}`);
            console.log(`  Preview: ${row.customer_sig_preview || 'N/A'}`);
            console.log(`  Contractor sig: ${row.contractor_sig_length ? row.contractor_sig_length + ' chars' : 'NULL/EMPTY'}`);
            console.log(`  Preview: ${row.contractor_sig_preview || 'N/A'}`);
            console.log('');
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkSignatureData();
