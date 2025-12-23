const { query } = require('./config/database');
const fs = require('fs');

async function debug() {
    try {
        let output = '--- RECENT PROJECTS ---\n';
        const projects = await query('SELECT p.id, p.contract_number, pd.insulation_type, pd.vapor_barrier_type, pd.breathable_membrane_type FROM projects p JOIN project_details pd ON p.id = pd.project_id ORDER BY p.created_at DESC LIMIT 3');
        output += JSON.stringify(projects.rows, null, 2) + '\n';

        output += '\n--- RECENT PHOTOS ---\n';
        const photos = await query('SELECT id, project_id, photo_type, file_path FROM photos ORDER BY taken_at DESC LIMIT 10');
        output += JSON.stringify(photos.rows, null, 2) + '\n';

        fs.writeFileSync('debug_results.txt', output);
        console.log('Results written to debug_results.txt');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debug();
