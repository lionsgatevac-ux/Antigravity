const { query } = require('./config/database');

async function debugLastHour() {
    try {
        console.log('--- Photos Uploaded in Last Hour ---');
        const res = await query(
            "SELECT id, project_id, photo_type, file_path, taken_at " +
            "FROM photos WHERE taken_at >= NOW() - INTERVAL '1 hour' " +
            "ORDER BY taken_at DESC"
        );

        console.log(`Found ${res.rows.length} photos.`);
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | PID: ${r.project_id} | Type: ${r.photo_type} | Taken: ${r.taken_at} | Path: ${r.file_path}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugLastHour();
