const { query } = require('./config/database');

const sql = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'contractor', -- 'admin', 'contractor', 'external'
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    company_address VARCHAR(255),
    company_tax_number VARCHAR(100),
    company_reg_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to projects table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'user_id') THEN
        ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id);
    END IF;
END $$;
`;

async function run() {
    try {
        console.log('🔄 Running migration...');
        await query(sql);
        console.log('✅ Migration successful: users table created and projects updated.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

run();
