const { query } = require('./config/database');

async function debugToday() {
    try {
        console.log('--- Photos Uploaded Today (2025-12-22) ---');
        const res = await query(
            "SELECT p.contract_number, ph.photo_type, ph.file_path, ph.taken_at " +
            "FROM photos ph " +
            "LEFT JOIN projects p ON ph.project_id = p.id " +
            "WHERE ph.taken_at >= '2025-12-22 00:00:00' " +
            "ORDER BY ph.taken_at DESC"
        );

        console.log(`Found ${res.rows.length} photos from today.`);
        res.rows.forEach(r => {
            console.log(`${r.contract_number || 'UNKNOWN'} | ${r.photo_type} | ${r.taken_at} | ${r.file_path}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

debugToday();
