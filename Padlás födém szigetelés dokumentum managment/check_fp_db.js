const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkFloorPlans() {
    try {
        console.log('🔍 Checking latest 5 floor plans...');
        const res = await pool.query(`
            SELECT id, project_id, photo_type, file_path, file_url, taken_at 
            FROM photos 
            WHERE photo_type = 'floor_plan' 
            ORDER BY taken_at DESC 
            LIMIT 5
        `);

        if (res.rows.length === 0) {
            console.log('❌ No floor plan photos found.');
        } else {
            console.log('✅ Found ' + res.rows.length + ' floor plans:');
            res.rows.forEach(r => {
                console.log(JSON.stringify(r));
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkFloorPlans();
