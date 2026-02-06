const { query } = require('./config/database');

async function checkAndFix() {
    console.log('--- Checking Database Schema ---');
    try {
        // 1. Check for attic_door_insulated column
        const checkRes = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'project_details' AND column_name = 'attic_door_insulated'
        `);

        if (checkRes.rows.length === 0) {
            console.log('⚠️ Column "attic_door_insulated" is MISSING in project_details.');
            console.log('🛠️ Adding column...');
            await query(`ALTER TABLE project_details ADD COLUMN attic_door_insulated BOOLEAN DEFAULT FALSE`);
            console.log('✅ Column added successfully.');
        } else {
            console.log('✅ Column "attic_door_insulated" already exists.');
        }

        // 2. Check for pf_kivul fields just in case
        const pfFields = ['pf_kivul_fodemen', 'pf_kivul_oromfal', 'pf_kivul_bonthato', 'pf_kivul_egyeb', 'pf_kivul_egyeb_szoveg'];
        for (const field of pfFields) {
            const res = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'project_details' AND column_name = $1
            `, [field]);

            if (res.rows.length === 0) {
                console.log(`⚠️ Column "${field}" is MISSING.`);
                const type = field.includes('szoveg') ? 'TEXT' : 'BOOLEAN DEFAULT FALSE';
                await query(`ALTER TABLE project_details ADD COLUMN ${field} ${type}`);
                console.log(`✅ Column "${field}" added.`);
            } else {
                console.log(`✅ Column "${field}" exists.`);
            }
        }

        console.log('--- Database Check Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error checking/fixing DB:', err);
        process.exit(1);
    }
}

checkAndFix();
