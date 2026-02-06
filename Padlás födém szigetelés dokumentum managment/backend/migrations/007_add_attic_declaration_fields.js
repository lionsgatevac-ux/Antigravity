const { query } = require('../config/database');

async function migrate() {
    console.log('Running migration: 007_add_attic_declaration_fields');

    try {
        // Add new boolean columns and text column
        await query(`
            ALTER TABLE project_details
            ADD COLUMN IF NOT EXISTS pf_kivul_fodemen BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS pf_kivul_oromfal BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS pf_kivul_bonthato BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS pf_kivul_egyeb BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS pf_kivul_egyeb_szoveg VARCHAR(255);
        `);

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
