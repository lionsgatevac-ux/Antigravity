const { pool } = require('./config/database');

async function checkColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'properties';
        `);
        console.log('---COLUMNS START---');
        result.rows.forEach(r => console.log(r.column_name));
        console.log('---COLUMNS END---');
        process.exit(0);
    } catch (err) {
        console.error('Error checking columns:', err);
        process.exit(1);
    }
}

checkColumns();
