require('dotenv').config();
const path = require('path');

// Try loading from root .env first (default behavior of dotenv.config())
// Then try specific paths if needed
console.log('--- ADATBÁZIS KONFIGURÁCIÓ KERESÉSE ---');

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    // Try loading from backend/.env manually if root .env missing/empty
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    require('dotenv').config({ path: backendEnvPath });
    dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        console.log(`Backend .env-ből betöltve: ${backendEnvPath}`);
    }
} else {
    console.log('Root .env-ből betöltve.');
}

if (dbUrl) {
    console.log(`\nTeljes Connection String: ${dbUrl}`);

    // Parse password
    try {
        const url = new URL(dbUrl);
        const password = url.password;
        if (password) {
            console.log(`\n🔑 JELSZÓ: ${password}`);
        } else {
            console.log('\n⚠️  A Connection String nem tartalmaz jelszót.');
        }
    } catch (e) {
        // Fallback regex if URL parsing fails
        const match = dbUrl.match(/:([^:@]+)@/);
        if (match) {
            console.log(`\n🔑 JELSZÓ: ${match[1]}`);
        } else {
            console.log('\n❌ Nem sikerült kinyerni a jelszót az URL-ből.');
        }
    }
} else {
    console.log('\n❌ NEM TALÁLHATÓ DATABASE_URL egyetlen .env fájlban sem.');
}
console.log('-------------------------------------------');
