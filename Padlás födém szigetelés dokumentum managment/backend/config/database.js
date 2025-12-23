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

// Use a config object to handle special password characters (space) better than URL string
const getConfig = () => {
    const url = getConnectionString();

    // Explicitly check for development environment or missing URL
    // If no URL or localhost, try to prioritize local config with known password
    if (!url || (process.env.NODE_ENV !== 'production' && url.includes('localhost'))) {
        console.log('🔧 Config: Using local development configuration with explicit password.');
        return {
            user: 'postgres',
            host: 'localhost',
            database: 'bozso_db',
            password: 'Biznisz matek',
            port: 5432,
            max: 20, // Pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
    }

    return {
        connectionString: url,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
};

const pool = new Pool(getConfig());

// Test connection
pool.on('connect', () => {
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
