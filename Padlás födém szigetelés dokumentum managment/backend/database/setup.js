const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('🗄️  Setting up database...');

    try {
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database schema created successfully');

        // Create upload directories
        const uploadDir = path.join(__dirname, '..', 'uploads');
        const generatedDir = path.join(__dirname, '..', 'generated');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('✅ Created uploads directory');
        }

        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
            console.log('✅ Created generated directory');
        }

        console.log('🎉 Database setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();
