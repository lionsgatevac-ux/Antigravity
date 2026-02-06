const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL from environment or Cloud Run
const DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
});

async function migrateProductionDatabase() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting production database migration...\n');

        // CLEAR OLD DATA
        console.log('Dropping existing materials table...');
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
        console.log('✓ Materials table created');

        console.log('Creating unique index...');
        await client.query('CREATE UNIQUE INDEX unique_material_idx ON materials(category, name)');
        console.log('✓ Index created');

        // Seed default materials
        console.log('\nSeeding NEW materials...');

        const materials = [
            // Insulation
            { category: 'insulation', name: 'Thermowool Basic 15cm üveggyapot tekercs (0.039)', is_default: true },
            { category: 'insulation', name: 'Thermowool Basic 5/10cm üveggyapot tekercs (0.039)', is_default: false },

            // Vapor Barriers
            { category: 'vapor_barrier', name: 'MP Linopore VY 1500 párafékező takarófólia 60 g-os (75m2)', is_default: true },
            { category: 'vapor_barrier', name: 'BB - REFLEX hőtükrös párazáró fólia - 120 cm széles', is_default: false },

            // Breathable Membranes
            { category: 'breathable_membrane', name: 'ÚjHáz Dachler Kronfol 140 Páraáteresztő tetőfólia 1,6x50 m', is_default: true },
            { category: 'breathable_membrane', name: 'MP Linopore WP 100 páraáteresztő takarófólia (75m2)', is_default: false },
            { category: 'breathable_membrane', name: 'ÚjHáz Dachler Kronfol 120 Páraáteresztő tetőfólia 1,6x50 m', is_default: false }
        ];

        for (const material of materials) {
            try {
                await client.query(
                    'INSERT INTO materials (category, name, is_default) VALUES ($1, $2, $3)',
                    [material.category, material.name, material.is_default || false]
                );
                console.log(`  ✓ ${material.name}`);
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`  - ${material.name} (már létezik)`);
                } else {
                    throw err;
                }
            }
        }

        // Verify
        const result = await client.query('SELECT COUNT(*) FROM materials');
        console.log(`\n✅ Migration complete! Total materials: ${result.rows[0].count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateProductionDatabase();
