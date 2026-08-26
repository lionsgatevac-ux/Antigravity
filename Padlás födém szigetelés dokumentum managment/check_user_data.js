const { query } = require('./backend/config/database');

async function checkUser() {
    try {
        console.log('--- User Adat Ellenőrzése ---');
        const res = await query('SELECT * FROM users LIMIT 1');
        console.log(res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
