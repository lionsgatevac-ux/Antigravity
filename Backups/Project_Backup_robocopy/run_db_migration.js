const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const migrationFile = path.join(__dirname, 'migrations', '002_add_signatures_to_projects.sql');

console.log('📦 Adatbázis Migrációs Segédlet (3. verzió - Config Object)');
console.log('-----------------------------------------');

const runMigration = async (config) => {
    const pool = new Pool(config);

    try {
        console.log(`\n🔄 Kapcsolódás: ${config.user}@${config.host}:${config.port}/${config.database}`);
        const client = await pool.connect();
        console.log('✅ SIKERES KAPCSOLAT!');

        console.log('📄 Migráció olvasása...');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('🚀 Migráció futtatása...');
        await client.query(sql);

        console.log('\n✅✅✅ MIGRÁCIÓ SIKERESEN LEFUTOTT! ✅✅✅');
        console.log('Az adatbázis frissítve lett.');

        client.release();
    } catch (err) {
        console.error('\n❌ HIBA:', err.message);
        if (err.message.includes('authentication failed')) {
            console.log(' Tipp: A jelszó még mindig nem jó.');
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
};

const askForPassword = () => {
    console.log('Az adatbázis neve: bozso_db');
    console.log('A felhasználó: postgres');
    console.log('A jelszó valószínűleg: "Biznisz matek" (szóközzel)');

    rl.question('Jelszó (ENTER = "Biznisz matek"): ', (answer) => {
        let password = answer.trim();
        if (!password) {
            password = 'Biznisz matek';
        }

        const config = {
            user: 'postgres',
            host: 'localhost',
            database: 'bozso_db',
            password: password,
            port: 5432,
            ssl: false // Localhost usually implies no SSL
        };

        runMigration(config);
        rl.close();
    });
};

askForPassword();
