const { query } = require('./config/database');

async function debugOrphans() {
    try {
        console.log('--- Checking for Orphaned Photos ---');
        const orphans = await query(
            "SELECT * FROM photos WHERE project_id IS NULL OR project_id::text = 'undefined' OR photo_type = 'general' ORDER BY taken_at DESC LIMIT 20"
        );

        console.log(`Found ${orphans.rows.length} potential orphans.`);
        orphans.rows.forEach(p => {
            console.log(`ID: ${p.id}, PID: ${p.project_id}, Type: ${p.photo_type}, Path: ${p.file_path}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugOrphans();
