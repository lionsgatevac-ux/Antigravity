const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function verifyMaterials() {
    try {
        // Count by category
        const countResult = await pool.query(
            'SELECT category, COUNT(*) as count FROM materials GROUP BY category ORDER BY category'
        );

        console.log('📊 Materials by category:');
        countResult.rows.forEach(r => {
            console.log(`  ${r.category}: ${r.count} items`);
        });

        // List all materials
        const allResult = await pool.query(
            'SELECT * FROM materials ORDER BY category, name'
        );

        console.log('\n📋 All materials:');
        allResult.rows.forEach(r => {
            console.log(`  [${r.category}] ${r.name} ${r.is_default ? '(default)' : ''}`);
        });

        console.log(`\n✅ Total: ${allResult.rows.length} materials in database`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verifyMaterials();
