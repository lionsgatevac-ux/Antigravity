const { query } = require('./config/database');

async function debugCompact() {
    try {
        const res = await query("SELECT photo_type, project_id, taken_at FROM photos ORDER BY id DESC LIMIT 10");
        console.log('--- RECENT PHOTOS ---');
        res.rows.forEach(r => console.log(`Type: ${r.photo_type} | PID: ${r.project_id} | Time: ${r.taken_at}`));

        const proj = await query("SELECT id, contract_number FROM projects WHERE contract_number IN ('BOZSO-2025-0139', 'BOZSO-2025-0140')");
        console.log('\n--- TARGET PROJECTS ---');
        proj.rows.forEach(r => console.log(`ID: ${r.id} | No: ${r.contract_number}`));

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugCompact();
