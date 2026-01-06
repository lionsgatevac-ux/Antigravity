const { query } = require('./config/database');

const sql = `
-- Enable UUID extension if not available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id INTEGER -- Will link to users(id) later
);

-- 2. Create default organization if none exists
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organizations) THEN
        INSERT INTO organizations (name) VALUES ('Központi Referencia Kft.') RETURNING id INTO default_org_id;
    END IF;
END $$;

-- 3. Modify users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- 4. Assign existing users to the first organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations LIMIT 1) 
WHERE organization_id IS NULL;

-- 5. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Modify projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 7. Migrate existing projects
UPDATE projects
SET 
    created_by = user_id, 
    organization_id = (SELECT organization_id FROM users WHERE users.id = projects.user_id)
WHERE created_by IS NULL AND user_id IS NOT NULL;
`;

async function run() {
    try {
        console.log('🔄 Running multi-user schema migration...');
        await query(sql);
        console.log('✅ Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

run();
