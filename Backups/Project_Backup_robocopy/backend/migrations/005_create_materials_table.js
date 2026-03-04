const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createMaterialsTable() {
    const client = await pool.connect();
    try {
        console.log('Dropping existing materials table to clear fake data...');
        await client.query('DROP TABLE IF EXISTS materials CASCADE');
        console.log('✓ Dropped');

        console.log('Creating materials table...');
        await client.query(`
            CREATE TABLE materials (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table created');

        console.log('Creating unique index...');
        await client.query('CREATE UNIQUE INDEX unique_material_idx ON materials(category, name)');
        console.log('✓ Index created');

        console.log('Seeding real materials from invoices...');
        await client.query(`
            INSERT INTO materials (category, name, is_default) VALUES 
            -- Insulation
            ('insulation', 'Thermowool Basic 15cm üveggyapot tekercs (0.039)', true),
            ('insulation', 'Thermowool Basic 5/10cm üveggyapot tekercs (0.039)', false),
            
            -- Vapor Barriers (Párazáró/Párafékező)
            ('vapor_barrier', 'MP Linopore VY 1500 párafékező takarófólia 60 g-os (75m2)', true),
            ('vapor_barrier', 'BB - REFLEX hőtükrös párazáró fólia - 120 cm széles', false),
            
            -- Breathable Membranes (Páraáteresztő)
            ('breathable_membrane', 'ÚjHáz Dachler Kronfol 140 Páraáteresztő tetőfólia 1,6x50 m', true),
            ('breathable_membrane', 'MP Linopore WP 100 páraáteresztő takarófólia (75m2)', false),
            ('breathable_membrane', 'ÚjHáz Dachler Kronfol 120 Páraáteresztő tetőfólia 1,6x50 m', false)
        `);
        console.log('✓ Real materials seeded');

        // Verify
        const result = await client.query('SELECT * FROM materials ORDER BY category, name');
        console.log(`\n✓ Success! Materials table created with ${result.rows.length} material(s):`);
        // result.rows.forEach(row => {
        //     console.log(`  [${row.category}] ${row.name} ${row.is_default ? '(default)' : ''}`);
        // });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createMaterialsTable();
