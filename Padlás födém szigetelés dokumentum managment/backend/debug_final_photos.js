const { query } = require('./config/database');

async function debugFinal() {
    try {
        console.log('--- ALL PHOTOS (Last 10) ---');
        const res = await query("SELECT id, project_id, photo_type, taken_at FROM photos ORDER BY id DESC LIMIT 10");
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | PID: ${r.project_id} | Type: ${r.photo_type} | Time: ${r.taken_at}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugFinal();
