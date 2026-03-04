const { Pool } = require('pg');

const passwords = [
    'Biznisz matek',
    'Bizniszmatek',
    'postgres',
    'password',
    'admin',
    'Biznisz_matek',
    'Biznisz20matek'
];

async function probe() {
    console.log('🔍 Probing database passwords...');

    for (const password of passwords) {
        process.stdout.write(`Testing password: "${password}" ... `);
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'bozso_db',
            password: password,
            port: 5432
        });

        try {
            const client = await pool.connect();
            console.log('✅ SUCCESS!');
            console.log(`\n🎉 Found working password: "${password}"`);
            client.release();
            await pool.end();
            process.exit(0);
        } catch (err) {
            console.log('❌ Failed');
            // console.error(err.message);
            await pool.end();
        }
    }
    console.log('\n❌ All passwords failed.');
}

probe();
