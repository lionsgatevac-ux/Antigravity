const { query } = require('./config/database');
const fs = require('fs');

async function debug0139() {
    try {
        const proj = await query("SELECT id FROM projects WHERE contract_number = 'BOZSO-2025-0139'");
        const pid = proj.rows[0].id;
        console.log(`Checking photos for PID: ${pid}`);

        const res = await query("SELECT * FROM photos WHERE project_id = $1", [pid]);
        console.log(`Found ${res.rows.length} photos.`);
        res.rows.forEach(r => {
            const exists = fs.existsSync(r.file_path);
            console.log(`- ID: ${r.id} | Type: '${r.photo_type}' (Length: ${r.photo_type.length}) | Exists: ${exists} | Path: ${r.file_path}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debug0139();
