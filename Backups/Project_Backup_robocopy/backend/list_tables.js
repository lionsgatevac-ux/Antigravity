require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const listTables = async () => {
    try {
        await client.connect();
        const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        console.log('Tables:', JSON.stringify(res.rows.map(r => r.tablename)));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
};

listTables();
