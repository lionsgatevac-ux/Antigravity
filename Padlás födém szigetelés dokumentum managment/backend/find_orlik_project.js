const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function findRecentProjects() {
    try {
        // Search for all recent projects
        const result = await pool.query(`
            SELECT 
                p.id, 
                p.contract_number, 
                c.full_name, 
                pd.vapor_barrier_type, 
                pd.breathable_membrane_type,
                pd.insulation_type,
                p.created_at
            FROM projects p
            JOIN project_details pd ON p.id = pd.project_id
            JOIN customers c ON pd.customer_id = c.id
            ORDER BY p.created_at DESC
            LIMIT 20
        `);

        console.log('Recent 20 projects:');
        result.rows.forEach(row => {
            console.log(`\nID: ${row.id}`);
            console.log(`Contract: ${row.contract_number}`);
            console.log(`Customer: ${row.full_name}`);
            console.log(`Created: ${row.created_at}`);
            console.log(`Vapor Barrier: ${row.vapor_barrier_type || 'None'}`);
            console.log(`Breathable Membrane: ${row.breathable_membrane_type || 'None'}`);
            console.log(`Insulation: ${row.insulation_type || 'None'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

findRecentProjects();
