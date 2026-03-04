const { query } = require('./config/database');

const addRemoteSignatureColumns = async () => {
    try {
        console.log('🔄 Adding remote signature columns...');

        await query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS remote_signature_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS remote_signature_expires_at TIMESTAMP
        `);

        console.log('✅ Columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        process.exit(1);
    }
};

addRemoteSignatureColumns();
