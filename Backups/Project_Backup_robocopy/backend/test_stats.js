require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

const testStats = async () => {
    try {
        await client.connect();
        const total = await client.query('SELECT COUNT(*) as count FROM projects');
        console.log('Total Projects:', total.rows[0].count);

        const details = await client.query('SELECT SUM(net_area) as total_area FROM project_details');
        console.log('Total Area:', details.rows[0].total_area);
    } catch (e) { console.error('Stats Error:', e); }
    finally { await client.end(); }
};
testStats();
