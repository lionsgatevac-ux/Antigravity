const { query } = require('./config/database');

async function debugPhotos() {
    try {
        const fpCount = await query("SELECT COUNT(*) FROM photos WHERE photo_type = 'floor_plan'");
        console.log(`Floor Plan Count: ${fpCount.rows[0].count}`);

        const otherCount = await query("SELECT COUNT(*) FROM photos WHERE photo_type = 'other'");
        console.log(`Other Count: ${otherCount.rows[0].count}`);

        const allTypes = await query("SELECT DISTINCT photo_type FROM photos");
        console.log('All available types:', allTypes.rows.map(r => r.photo_type).join(', '));

        const latestFp = await query(
            "SELECT p.contract_number, ph.file_path, ph.taken_at " +
            "FROM photos ph JOIN projects p ON ph.project_id = p.id " +
            "WHERE ph.photo_type = 'floor_plan' " +
            "ORDER BY ph.taken_at DESC LIMIT 5"
        );
        console.log('\n--- Latest 5 Floor Plans ---');
        latestFp.rows.forEach(r => {
            console.log(`${r.contract_number} | ${r.taken_at} | ${r.file_path}`);
        });

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debugPhotos();
