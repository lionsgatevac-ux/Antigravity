const { query } = require('./config/database');

async function debugMeta() {
    try {
        console.log('--- Today Photos Detailed ---');
        const res = await query(
            "SELECT id, project_id, photo_type, file_path, metadata " +
            "FROM photos WHERE taken_at >= '2025-12-22 00:00:00' " +
            "ORDER BY taken_at DESC"
        );

        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | PID: ${r.project_id} | Type: '${r.photo_type}' | Path: ${r.file_path}`);
            console.log(`Metadata: ${JSON.stringify(r.metadata)}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugMeta();
