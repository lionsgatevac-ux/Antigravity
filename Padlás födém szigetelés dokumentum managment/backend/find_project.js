const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'bozso_db',
    password: 'Biznisz matek',
    port: 5432
});

async function findProject() {
    try {
        const res = await pool.query('SELECT id, contract_number FROM projects LIMIT 1');
        if (res.rows.length > 0) {
            console.log('✅ Found Project:', res.rows[0]);
        } else {
            console.log('❌ No projects found in database.');
        }
    } catch (err) {
        console.error('❌ Error finding project:', err);
    } finally {
        await pool.end();
    }
}

findProject();
