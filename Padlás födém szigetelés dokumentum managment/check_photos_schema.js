const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        console.log('🔍 Checking photos table schema...');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'photos'
        `);

        if (res.rows.length === 0) {
            console.log('❌ Table photos NOT FOUND!');
        } else {
            console.log('✅ Found photos table columns:');
            res.rows.forEach(r => {
                console.log(`- ${r.column_name} (${r.data_type})`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
