const { query } = require('./config/database');
const Project = require('./models/Project');
const fs = require('fs');

async function verify() {
    try {
        // 1. Get a project
        const res = await query('SELECT id FROM projects LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No projects found to verify.');
            process.exit(0);
        }
        const projectId = res.rows[0].id;
        console.log(`Verifying project: ${projectId}`);

        // 2. Get project data like Route does
        const projectData = await Project.findById(projectId);

        // 3. Get Floor Plan Logic (Copied from Route)
        const floorPlanResult = await query(
            "SELECT file_path FROM photos WHERE project_id = $1 AND photo_type = 'floor_plan' ORDER BY taken_at DESC LIMIT 1",
            [projectId]
        );
        let floorPlanBase64 = null;
        if (floorPlanResult.rows.length > 0) {
            const fpPath = floorPlanResult.rows[0].file_path;
            if (fs.existsSync(fpPath)) {
                floorPlanBase64 = 'YES_IT_EXISTS_AND_LOADED'; // Mocking base64 for log readability
            } else {
                floorPlanBase64 = 'FILE_MISSING_ON_DISK';
            }
        } else {
            floorPlanBase64 = 'NO_FLOOR_PLAN_IN_DB';
        }

        console.log('--- VERIFICATION RESULTS ---');
        console.log('Customer Signature Data Present:', !!projectData.customer_signature_data);
        console.log('Contractor Signature Data Present:', !!projectData.contractor_signature_data);
        console.log('Floor Plan Loaded:', floorPlanBase64);

        console.log('\n--- TEMPLATE DATA MAPPING PREVIEW ---');
        console.log('nev:', projectData.full_name);
        console.log('nettoalapterulet:', projectData.net_area);
        console.log('alairasugyfel (Preview):', projectData.customer_signature_data ? projectData.customer_signature_data.substring(0, 30) + '...' : 'MISSING');
        console.log('alaprajz (Status):', floorPlanBase64);

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
