const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
// Create PostgreSQL connection pool
// PATCH: Fix local connection issues by forcing correct DB and password if needed
const getConnectionString = () => {
    let url = process.env.DATABASE_URL;
    if (!url) return '';

    // Fix database name
    if (url.includes('padlas_szigeteles') || url.includes('postgres?')) {
        console.log('🔧 Config: Fixing database name to "bozso_db"');
        url = url.replace(/padlas_szigeteles|postgres(?=\?|$)/, 'bozso_db');
    }

    return url;
};

const getConfig = () => {
    // Detect production: NODE_ENV or Google Cloud Run service name
    const isProduction = process.env.NODE_ENV === 'production' || process.env.K_SERVICE !== undefined;

    // NUCLEAR OPTION: Hardcoded, Pre-Encoded URL
    // Biznisz%20matek is correctly encoded.
    // Host: aws-1-eu-central-1.pooler.supabase.com
    // Port: 6543
    const prodUrl = 'postgresql://postgres.pkjohziwbiiyzyospuot:Biznisz%20matek@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

    if (isProduction) {
        console.log('globe Config: Forcing Hardcoded Production URL.');
        // Bypass env var check completely for production to guarantee correct credentials
        return {
            connectionString: prodUrl,
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };
    }

    // 1. If DATABASE_URL is provided (e.g. from Docker or Env) and NOT successfully handled by production check above
    if (process.env.DATABASE_URL) {
        console.log('wrench Config: Using provided DATABASE_URL environment variable.');
        let url = process.env.DATABASE_URL;

        // Fix database name override compatibility
        if (url.includes('padlas_szigeteles') || url.includes('postgres?')) {
            url = url.replace(/padlas_szigeteles|postgres(?=\?|$)/, 'bozso_db');
        }

        const config = {
            connectionString: url,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        };

        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            console.log('wrench Config: SSL disabled for local connection.');
        } else {
            config.ssl = { rejectUnauthorized: false };
        }
        return config;
    }

    console.log('wrench Config: Using local development configuration (Fallback).');
    return {
        user: 'postgres',
        host: 'localhost',
        database: 'bozso_db',
        password: 'Biznisz matek',
        port: 5432,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };
};

const config = getConfig();
console.log('DEBUG: DB Config:', { ...config, password: config.password ? '***' : 'missing' });
const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
    console.log('✅ Database connected successfully!');
    // Less verbose, only log once
    if (!global.dbConnected) {
        console.log('✅ Database connected successfully');
        global.dbConnected = true;
    }
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error (client):', err.message);
    // Don't exit immediately, let the request fail gracefully if possible
    // process.exit(-1); 
});

// Query helper function
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    query,
    transaction
};
