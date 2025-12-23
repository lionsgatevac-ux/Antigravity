const { Pool } = require('pg');
require('dotenv').config();

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'bozso_db',
    password: 'Biznisz matek',
    port: 5432,
};

const pool = new Pool(config);

async function verify() {
    try {
        console.log('🔌 Csatlakozás a bozso_db adatbázishoz...');
        const client = await pool.connect();
        console.log('✅ Sikeres kapcsolat.');

        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            AND column_name IN ('customer_signature_data', 'contractor_signature_data');
        `);

        if (res.rows.length === 2) {
            console.log('✅✅ SIKER: Az aláírás oszlopok LÉTEZNEK az adatbázisban.');
        } else {
            console.log('❌ HIBA: Az oszlopok HIÁNYZANAK!');
            console.log(`Megtalált oszlopok: ${res.rows.map(r => r.column_name).join(', ')}`);
        }

        client.release();
    } catch (err) {
        console.error('❌ Csatlakozási hiba:', err.message);
    } finally {
        await pool.end();
    }
}

verify();
