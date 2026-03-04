const { pool } = require('./config/database');

async function debug() {
    try {
        console.log('Fetching users...');
        const users = await pool.query('SELECT id, email, role, organization_id FROM users');
        console.log('Found users:', users.rows);

        if (users.rows.length === 0) {
            console.log('No users found.');
            return;
        }

        const user = users.rows[0];
        console.log(`Testing query for user: ${user.email} (ID: ${user.id}, Org: ${user.organization_id})`);

        let sql = `SELECT p.*, c.full_name as customer_name, pd.net_area, pd.energy_saving_gj, pr.address_city as property_city,
                   u.company_name as owner_company
                   FROM projects p 
                   LEFT JOIN project_details pd ON p.id = pd.project_id 
                   LEFT JOIN customers c ON pd.customer_id = c.id
                   LEFT JOIN properties pr ON pd.property_id = pr.id
                   LEFT JOIN users u ON p.created_by = u.id`;

        const conditions = [];
        const params = [];

        // Replicate logic from Project.js
        conditions.push(`p.organization_id = $${params.length + 1}`);
        params.push(user.organization_id);

        if (user.role === 'admin') {
            // Admin sees all in org
        } else {
            conditions.push(`p.created_by = $${params.length + 1}`);
            params.push(user.id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY p.created_at DESC';

        console.log('Executing SQL:', sql);
        console.log('Params:', params);

        const result = await pool.query(sql, params);
        console.log(`Query successful. Rows: ${result.rows.length}`);
        if (result.rows.length > 0) {
            console.log('First row sample:', result.rows[0]);
        }

    } catch (err) {
        console.error('ERROR executing query:', err);
    } finally {
        pool.end();
    }
}

debug();
