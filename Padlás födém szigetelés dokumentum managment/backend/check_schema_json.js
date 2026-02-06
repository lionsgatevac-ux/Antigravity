const { pool } = require('./config/database');
const fs = require('fs');

async function checkSchema() {
    try {
        const projRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'projects';
        `);

        const userRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        const output = {
            projects: projRes.rows,
            users: userRes.rows
        };

        fs.writeFileSync('schema_status.json', JSON.stringify(output, null, 2));
        console.log('Schema status written to schema_status.json');

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        pool.end();
    }
}

checkSchema();
