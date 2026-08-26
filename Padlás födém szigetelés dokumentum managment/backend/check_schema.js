process.env.NODE_ENV = "production";
const { query, pool } = require('./config/database');

async function checkSchema() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'project_details' 
            AND column_name IN ('execution_date', 'work_start_date', 'work_end_date')
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch(err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
checkSchema();
