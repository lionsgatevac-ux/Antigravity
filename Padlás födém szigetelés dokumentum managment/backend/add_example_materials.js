const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function addExampleMaterials() {
    const client = await pool.connect();
    try {
        console.log('Adding example foil materials...\n');

        // Example vapor barrier foils
        const vaporBarriers = [
            'Kingspan Nilvent ALU 150',
            'Kingspan Nilvent 150',
            'Delta Reflex',
            'Tyvek VCL SD5'
        ];

        // Example breathable membrane foils
        const breathableMembranes = [
            'Kingspan Nilvent Plus 170',
            'Delta Vent N',
            'Tyvek Solid',
            'Jutadach 135'
        ];

        console.log('Párazáró fóliák (Vapor Barriers):');
        for (const name of vaporBarriers) {
            try {
                await client.query(
                    'INSERT INTO materials (category, name) VALUES ($1, $2)',
                    ['vapor_barrier', name]
                );
                console.log(`  ✓ ${name}`);
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`  - ${name} (már létezik)`);
                } else {
                    throw err;
                }
            }
        }

        console.log('\nPáraáteresztő fóliák (Breathable Membranes):');
        for (const name of breathableMembranes) {
            try {
                await client.query(
                    'INSERT INTO materials (category, name) VALUES ($1, $2)',
                    ['breathable_membrane', name]
                );
                console.log(`  ✓ ${name}`);
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`  - ${name} (már létezik)`);
                } else {
                    throw err;
                }
            }
        }

        // Show all materials
        const result = await client.query('SELECT * FROM materials ORDER BY category, name');
        console.log(`\n✅ Total materials in database: ${result.rows.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addExampleMaterials();
