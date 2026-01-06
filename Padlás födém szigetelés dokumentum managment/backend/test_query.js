require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const testParams = async () => {
    try {
        await client.connect();
        console.log('Connected.');

        // 1. Get Admin User
        const userRes = await client.query("SELECT * FROM users WHERE email = 'lionsgatevac@gmail.com'");
        const user = userRes.rows[0];

        // 2. Run Query
        const sql = `SELECT p.*, c.full_name as customer_name, pd.net_area, pd.energy_saving_gj, pr.address_city as property_city,
                   u.company_name as owner_company
                   FROM projects p 
                   LEFT JOIN project_details pd ON p.id = pd.project_id 
                   LEFT JOIN customers c ON pd.customer_id = c.id
                   LEFT JOIN properties pr ON pd.property_id = pr.id
                   LEFT JOIN users u ON p.created_by = u.id
                   WHERE p.organization_id = $1`;

        console.log('Running SQL...');
        const res = await client.query(sql, [user.organization_id]);
        console.log('Rows:', res.rows.length);

    } catch (err) {
        console.error('Query Failed:', err.message);
    } finally {
        await client.end();
    }
};

testParams();
