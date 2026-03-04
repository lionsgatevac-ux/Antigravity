require('dotenv').config({ path: './backend/.env' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        await client.connect();
        console.log('Connected to database');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'project_details';
        `);

        console.log('Columns in project_details:');
        res.rows.forEach(row => {
            console.log(`${row.column_name} (${row.data_type})`);
        });

        // Check for specific columns
        const requiredColumns = [
            'attic_door_insulated',
            'pf_kivul_fodemen',
            'pf_kivul_oromfal',
            'pf_kivul_bonthato',
            'pf_kivul_egyeb',
            'pf_kivul_egyeb_szoveg'
        ];

        const existingColumns = res.rows.map(r => r.column_name);
        const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));

        if (missingColumns.length > 0) {
            console.log('Missing columns:', missingColumns);
        } else {
            console.log('All required columns are present.');
        }

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
