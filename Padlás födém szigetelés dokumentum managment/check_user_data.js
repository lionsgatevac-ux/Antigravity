const { query } = require('./backend/config/database');

async function checkUser() {
    try {
        const result = await query("SELECT id, email, role, organization_id, company_name FROM users WHERE email = 'admin@bozso.hu'"); // Assuming admin email
        console.log('User Record:', result.rows);
    } catch (err) {
        console.error('Error checking user:', err);
    } finally {
        process.exit();
    }
}

checkUser();
