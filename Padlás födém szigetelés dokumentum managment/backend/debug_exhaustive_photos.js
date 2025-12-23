const { query } = require('./config/database');
const fs = require('fs');

async function debugExhaustivePhotos() {
    try {
        console.log('--- Exhaustive Photo Debug (Latest 20) ---');
        const photos = await query(
            "SELECT ph.id, p.contract_number, ph.project_id, ph.photo_type, ph.file_path, ph.taken_at " +
            "FROM photos ph " +
            "LEFT JOIN projects p ON ph.project_id = p.id " +
            "ORDER BY ph.taken_at DESC LIMIT 20"
        );

        const results = [];
        photos.rows.forEach(p => {
            const exists = p.file_path ? fs.existsSync(p.file_path) : false;
            results.push(`ID: ${p.id} | Project: ${p.contract_number || 'NULL'} | PID: ${p.project_id || 'NULL'} | Type: ${p.photo_type} | Taken: ${p.taken_at} | Exists: ${exists} | Path: ${p.file_path}`);
        });

        fs.writeFileSync('exhaustive_photos.txt', results.join('\n'));
        console.log('Results written to exhaustive_photos.txt');

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debugExhaustivePhotos();
