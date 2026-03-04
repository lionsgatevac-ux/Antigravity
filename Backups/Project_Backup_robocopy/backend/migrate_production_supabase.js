const { Pool } = require('pg');

// Production Supabase connection
const DATABASE_URL = 'postgresql://postgres.pkjohziwbiiyzyospuot:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateProductionDatabase() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting production database migration...\n');

        // Check if materials table already exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'materials'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('⚠️  Materials table already exists. Skipping creation.');
        } else {
            console.log('Creating materials table...');
            await client.query(`
                CREATE TABLE materials (
                    id SERIAL PRIMARY KEY,
                    category VARCHAR(50) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    is_default BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✓ Materials table created');

            console.log('Creating unique index...');
            await client.query('CREATE UNIQUE INDEX unique_material_idx ON materials(category, name)');
            console.log('✓ Index created');
        }

        // Seed default materials
        console.log('\nSeeding materials...');

        const materials = [
            // Default insulation
            { category: 'insulation', name: 'Thermowool Basic üveggyapot tekercs (0.039)', is_default: true },
            // Vapor barriers
            { category: 'vapor_barrier', name: 'Kingspan Nilvent ALU 150' },
            { category: 'vapor_barrier', name: 'Kingspan Nilvent 150' },
            { category: 'vapor_barrier', name: 'Delta Reflex' },
            { category: 'vapor_barrier', name: 'Tyvek VCL SD5' },
            // Breathable membranes
            { category: 'breathable_membrane', name: 'Kingspan Nilvent Plus 170' },
            { category: 'breathable_membrane', name: 'Delta Vent N' },
            { category: 'breathable_membrane', name: 'Tyvek Solid' },
            { category: 'breathable_membrane', name: 'Jutadach 135' }
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
