const Project = require('./backend/models/Project');
const { query } = require('./backend/config/database');

async function run() {
    try {
        // Get a valid project ID first
        const init = await query('SELECT id FROM projects LIMIT 1');
        if (init.rows.length === 0) return;
        const realId = init.rows[0].id;

        console.log('Real Project ID:', realId);

        const project = await Project.findById(realId);
        console.log('Returned Project ID:', project.id);

        if (project.id === realId) {
            console.log('✅ ID MATCHES (No bug?)');
        } else {
            console.log('❌ ID MISMATCH (Bug confirmed!)');
            console.log('Returned ID is likely ProjectDetails ID or other.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

run();
