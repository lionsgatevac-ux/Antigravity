const { query } = require('./config/database');

async function fixMislabeled() {
    try {
        console.log('--- Fixing Mislabeled Floor Plans ---');
        // Find photos with 'general' type that have 'floor_plan' in original name (metadata) or filename
        const result = await query(
            "UPDATE photos " +
            "SET photo_type = 'floor_plan' " +
            "WHERE photo_type = 'general' " +
            "AND (metadata->>'originalName' LIKE '%floor_plan%' OR file_path LIKE '%floor_plan%') " +
            "RETURNING *"
        );

        console.log(`Updated ${result.rows.length} photos.`);
        result.rows.forEach(r => {
            console.log(`Fixed photo ID: ${r.id}, Project PID: ${r.project_id}, Path: ${r.file_path}`);
        });

    } catch (e) { console.error(e); } finally { process.exit(); }
}

fixMislabeled();
