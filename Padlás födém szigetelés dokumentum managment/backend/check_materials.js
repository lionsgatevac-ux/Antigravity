const { query } = require('./config/database');

async function checkMaterials() {
    try {
        console.log('Checking material_types table...');
        const result = await query('SELECT * FROM material_types');
        console.log(`Success! Found ${result.rows.length} rows.`);
        console.log(result.rows);
    } catch (error) {
        console.error('Error querying material_types:', error);
    }
}

checkMaterials();
