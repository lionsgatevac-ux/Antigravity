const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

async function checkUser() {
    try {
        console.log('Connecting to Prod DB...');
        const email = 'admin@bozso.hu';
        const password = 'password123';

        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.log('RESULT: User NOT found:', email);
        } else {
            console.log('RESULT: User FOUND:', email);
            const user = res.rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            console.log('Password Match:', isMatch);
            console.log('Stored Config:', {
                id: user.id,
                role: user.role,
                org_id: user.organization_id
            });
        }
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
