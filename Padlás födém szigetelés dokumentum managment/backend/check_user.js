require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const checkUser = async () => {
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM users WHERE email = 'lionsgatevac@gmail.com'");
        console.log(res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
};

checkUser();
