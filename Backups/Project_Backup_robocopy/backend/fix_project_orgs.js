require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const fixOrgs = async () => {
    try {
        await client.connect();

        // 1. Get Admin Org
        const userRes = await client.query("SELECT organization_id FROM users WHERE email = 'lionsgatevac@gmail.com'");
        const orgId = userRes.rows[0]?.organization_id;

        if (!orgId) { console.error('No Admin Org found'); return; }
        console.log('Admin Org ID:', orgId);

        // 2. Update Projects
        const projRes = await client.query("UPDATE projects SET organization_id = $1 WHERE organization_id IS NULL", [orgId]);
        console.log(`Updated ${projRes.rowCount} projects.`);

        // 3. Update Users (if any others exist and are null)
        const userUpdate = await client.query("UPDATE users SET organization_id = $1 WHERE organization_id IS NULL", [orgId]);
        console.log(`Updated ${userUpdate.rowCount} users.`);

    } catch (e) { console.error(e); }
    finally { await client.end(); }
};

fixOrgs();
