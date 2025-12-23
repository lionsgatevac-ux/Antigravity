const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const adminConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Biznisz matek',
    port: 5432,
};

async function setup() {
    console.log('🔌 Connecting to local PostgreSQL (postgres DB)...');
    const client = new Client(adminConfig);

    try {
        await client.connect();
        console.log('✅ Connected to postgres system DB.');

        // 1. Create Database
        console.log('Creating database "bozso_db"...');
        // Prevent errors if it exists by checking or dropping
        // We drop to ensure clean slate with schema
        try {
            // Terminate connections to the db we want to drop
            await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bozso_db' AND pid <> pg_backend_pid()`);
            await client.query('DROP DATABASE IF EXISTS bozso_db');
            await client.query('CREATE DATABASE bozso_db');
            console.log('✅ Database "bozso_db" created.');
        } catch (dbErr) {
            console.error('Error manipulating database:', dbErr);
            throw dbErr;
        } finally {
            await client.end();
        }

        // 2. Connect to new DB and run Schema
        console.log('🔌 Connecting to "bozso_db"...');
        const dbConfig = { ...adminConfig, database: 'bozso_db' };
        const dbClient = new Client(dbConfig);
        await dbClient.connect();

        const schemaPath = path.join(__dirname, 'backend', 'database', 'schema.sql');
        console.log(`Reading schema from ${schemaPath}...`);
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📜 Executing schema...');
        await dbClient.query(schemaSql);
        console.log('✅ Schema executed successfully!');

        await dbClient.end();
        console.log('🎉 Local database setup complete!');

    } catch (err) {
        console.error('❌ Setup failed:', err);
        if (err.code === 'ECONNREFUSED') {
            console.error('⚠️ Could not connect to localhost:5432. Is PostgreSQL running?');
        } else if (err.code === '28P01') {
            console.error('⚠️ Authentication failed! Please check if the password "Biznisz matek" is correct.');
        }
    }
}

setup();
