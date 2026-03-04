const { query } = require('./config/database');
const fs = require('fs');

async function debugAllRecentPhotos() {
    try {
        console.log('--- Latest 10 Photos in System ---');
        const photos = await query(
            "SELECT p.contract_number, ph.photo_type, ph.file_path, ph.taken_at " +
            "FROM photos ph " +
            "LEFT JOIN projects p ON ph.project_id = p.id " +
            "ORDER BY ph.taken_at DESC LIMIT 10"
        );

        if (photos.rows.length === 0) {
            console.log('No photos found in the system.');
        } else {
            photos.rows.forEach(p => {
                const exists = fs.existsSync(p.file_path);
                console.log(`Project: ${p.contract_number} | Type: ${p.photo_type} | Taken: ${p.taken_at} | Exists: ${exists} | Path: ${p.file_path}`);
            });
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debugAllRecentPhotos();
