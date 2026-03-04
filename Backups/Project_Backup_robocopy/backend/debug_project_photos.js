const { query } = require('./config/database');
const fs = require('fs');

async function debugProjectPhotos() {
    try {
        const projectIds = ['BOZSO-2025-0139', 'BOZSO-2025-0140'];

        for (const contractNum of projectIds) {
            console.log(`\n--- Project: ${contractNum} ---`);
            const projectResult = await query("SELECT id FROM projects WHERE contract_number = $1", [contractNum]);
            if (projectResult.rows.length === 0) {
                console.log(`Project ${contractNum} not found.`);
                continue;
            }
            const projectId = projectResult.rows[0].id;

            const photos = await query(
                "SELECT photo_type, file_path FROM photos WHERE project_id = $1",
                [projectId]
            );

            if (photos.rows.length === 0) {
                console.log('No photos found for this project.');
            } else {
                photos.rows.forEach(p => {
                    const exists = fs.existsSync(p.file_path);
                    console.log(`Type: ${p.photo_type} | Exists: ${exists} | Path: ${p.file_path}`);
                });
            }
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debugProjectPhotos();
