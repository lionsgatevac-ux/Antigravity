const { Client } = require('pg');
const { getConfig } = require('./backend/config/database');

async function checkSchema() {
    console.log('Checking database schema...');

    // Manually construct config to ensure we hit the right DB
    // Using the one from DEPLOY_FINAL.bat just to be sure if local env is weird
    const connectionString = "postgresql://postgres.pkjohziwbiiyzyospuot:BizniszMatek2024@aws-1-eu-central-1.pooler.supabase.com:6543/postgres";

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'properties';
        `);

        console.log('Columns in properties table:');
        const columns = res.rows.map(r => r.column_name);
        res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        if (columns.includes('heating_type')) {
            console.log('✅ heating_type column EXISTS.');
        } else {
            console.error('❌ heating_type column MISSING!');
        }

    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
