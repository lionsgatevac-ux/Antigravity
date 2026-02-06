const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRecent() {
    try {
        console.log('🔍 Checking floor plans from the last 24 hours...');
        const res = await pool.query(`
            SELECT id, project_id, taken_at, file_url 
            FROM photos 
            WHERE photo_type = 'floor_plan' 
            AND taken_at > NOW() - INTERVAL '24 hours'
            ORDER BY taken_at DESC
        `);

        if (res.rows.length === 0) {
            console.log('❌ No floor plans found from the last 24 hours.');
        } else {
            console.log(`✅ Found ${res.rows.length} recent floor plans:`);
            res.rows.forEach(r => {
                console.log(`[${r.taken_at}] ID: ${r.id} | Project: ${r.project_id} | URL: ${r.file_url ? 'YES' : 'NO'}`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkRecent();
