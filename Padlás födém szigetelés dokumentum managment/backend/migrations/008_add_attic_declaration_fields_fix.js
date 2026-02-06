const { query } = require('../config/database');

async function migrate() {
    console.log('--- Running Migration: 008_add_attic_declaration_fields_fix ---');
    try {
        // 1. attic_door_insulated
        const check1 = await query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'project_details' AND column_name = 'attic_door_insulated'
        `);
        if (check1.rows.length === 0) {
            await query(`ALTER TABLE project_details ADD COLUMN attic_door_insulated BOOLEAN DEFAULT FALSE`);
            console.log('✅ Added column: attic_door_insulated');
        } else {
            console.log('ℹ️ Column already exists: attic_door_insulated');
        }

        // 2. pf_kivul fields
        const pfFields = ['pf_kivul_fodemen', 'pf_kivul_oromfal', 'pf_kivul_bonthato', 'pf_kivul_egyeb', 'pf_kivul_egyeb_szoveg'];
        for (const field of pfFields) {
            const check = await query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'project_details' AND column_name = $1
            `, [field]);

            if (check.rows.length === 0) {
                const type = field.includes('szoveg') ? 'TEXT' : 'BOOLEAN DEFAULT FALSE';
                await query(`ALTER TABLE project_details ADD COLUMN ${field} ${type}`);
                console.log(`✅ Added column: ${field}`);
            } else {
                console.log(`ℹ️ Column already exists: ${field}`);
            }
        }

        console.log('--- Migration Complete ---');
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    migrate().then(() => process.exit(0));
}

module.exports = migrate;
