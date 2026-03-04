const { query } = require('./backend/config/database');

async function getAdminEmail() {
    try {
        const result = await query('SELECT email FROM users WHERE role = \'admin\' LIMIT 1');
        if (result.rows.length > 0) {
            console.log('Admin Email:', result.rows[0].email);
        } else {
            console.log('No admin found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

getAdminEmail();
