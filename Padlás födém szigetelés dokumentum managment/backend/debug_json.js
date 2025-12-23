const { query } = require('./config/database');

async function debugJson() {
    try {
        const res = await query("SELECT photo_type, project_id, taken_at FROM photos ORDER BY id DESC LIMIT 10");
        console.log('START_JSON');
        console.log(JSON.stringify(res.rows, null, 2));
        console.log('END_JSON');

        const proj = await query("SELECT id, contract_number FROM projects WHERE contract_number IN ('BOZSO-2025-0139', 'BOZSO-2025-0140')");
        console.log('\nSTART_PROJECTS');
        console.log(JSON.stringify(proj.rows, null, 2));
        console.log('END_PROJECTS');

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugJson();
