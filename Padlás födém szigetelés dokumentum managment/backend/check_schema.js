const { pool } = require('./config/database');

async function checkSchema() {
    try {
        console.log('Checking "projects" table columns:');
        const projRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'projects';
        `);
        projRes.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        console.log('\nChecking "users" table columns:');
        const userRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        userRes.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        pool.end();
    }
}

checkSchema();
