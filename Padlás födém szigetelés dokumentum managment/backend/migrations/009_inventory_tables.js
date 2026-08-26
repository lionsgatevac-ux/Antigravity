const { query } = require('../config/database');

async function runMigration() {
    try {
        console.log('🔄 Starting Inventory System Migration...');

        // 1. Modify materials table
        console.log('📦 Updating materials table...');
        await query(`
            ALTER TABLE materials 
            ADD COLUMN IF NOT EXISTS stock_quantity_current INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'db',
            ADD COLUMN IF NOT EXISTS coverage DECIMAL(10, 2) DEFAULT 1.0;
        `);

        // 2. Create material_transactions table
        console.log('📜 Creating material_transactions table...');
        await query(`
            CREATE TABLE IF NOT EXISTS material_transactions (
                id SERIAL PRIMARY KEY,
                material_id INTEGER REFERENCES materials(id),
                quantity_change INTEGER NOT NULL,
                transaction_type VARCHAR(50) NOT NULL, -- 'RESTOCK', 'HANDOVER', 'CORRECTION'
                project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
                recipient_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                signature_data TEXT,
                notes TEXT,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Inventory Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
