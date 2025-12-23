const { query } = require('./config/database');

async function debugTarget() {
    try {
        const idResult = await query("SELECT id FROM projects WHERE contract_number = 'BOZSO-2025-0140'");
        if (idResult.rows.length === 0) {
            console.log('Project 0140 not found');
            return;
        }
        const pid = idResult.rows[0].id;
        console.log(`Checking photos for PID: ${pid} (BOZSO-2025-0140)`);

        const photos = await query("SELECT * FROM photos WHERE project_id = $1", [pid]);
        console.log(`Found ${photos.rows.length} photos.`);
        photos.rows.forEach(p => {
            console.log(`- ID: ${p.id}, Type: ${p.photo_type}, Path: ${p.file_path}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugTarget();
