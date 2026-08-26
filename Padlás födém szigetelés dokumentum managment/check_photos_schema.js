const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { query, pool } = require('./backend/config/database');

async function checkSchema() {
    try {
        console.log('🔍 Checking photos table schema...');
        const res = await query(`
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

            // Check constraint on photo_type if exists
            console.log('\n🔍 Checking constraints on photo_type...');
            const constraintRes = await query(`
                SELECT constraint_name, check_clause
                FROM information_schema.check_constraints
                WHERE constraint_name IN (
                    SELECT constraint_name 
                    FROM information_schema.constraint_column_usage 
                    WHERE table_name = 'photos' AND column_name = 'photo_type'
                )
            `);

            if (constraintRes.rows.length > 0) {
                console.log('⚠️ Found CHECK constraints on photo_type:');
                constraintRes.rows.forEach(r => {
                    console.log(`- ${r.constraint_name}: ${r.check_clause}`);
                });
            } else {
                console.log('✅ No CHECK constraints found on photo_type (likely text or enum without check).');
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
