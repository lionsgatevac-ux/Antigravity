require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt'); // We don't need bcrypt for this, just db query simulation

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const testAdminData = async () => {
    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Get Admin User
        const userRes = await client.query("SELECT * FROM users WHERE email = 'lionsgatevac@gmail.com'");
        const user = userRes.rows[0];
        console.log('Admin User Org ID:', user.organization_id);

        if (!user) {
            console.error('Admin user not found!');
            return;
        }

        // 2. Simulate Stats Overview Query (from routes/stats.js)
        console.log('Testing Stats Overview...');
        // Need to check what potential query is running.
        // Assuming it filters by organization_id
        try {
            const projectsRes = await client.query('SELECT * FROM projects WHERE organization_id = $1', [user.organization_id]);
            console.log(`Projects found for org: ${projectsRes.rows.length}`);
        } catch (err) {
            console.error('Stats Query Failed:', err.message);
        }

        // 3. Simulate Projects List Query (from routes/projects.js)
        console.log('Testing Project List...');
        try {
            // Note: routes/projects.js likely uses more complex join
            const queryText = `
                SELECT p.*, c.name as customer_name, pr.city as property_city 
                FROM projects p
                LEFT JOIN customers c ON p.customer_id = c.id
                LEFT JOIN properties pr ON p.property_id = pr.id
                WHERE p.organization_id = $1
                ORDER BY p.created_at DESC
            `;
            const listRes = await client.query(queryText, [user.organization_id]);
            console.log(`Projects list count: ${listRes.rows.length}`);
        } catch (err) {
            console.error('Project List Query Failed:', err.message);
        }

    } catch (err) {
        console.error('General Error:', err);
    } finally {
        await client.end();
    }
};

testAdminData();
