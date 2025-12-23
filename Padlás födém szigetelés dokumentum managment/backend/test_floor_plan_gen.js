const { query } = require('./config/database');
const documentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');

async function testFloorPlanGen() {
    try {
        const contractNum = 'BOZSO-2025-0139';
        console.log(`Testing floor plan generation for ${contractNum}...`);

        const projectResult = await query(
            `SELECT p.id as real_project_id, p.contract_number, pd.*, c.full_name as full_name, c.id_number 
             FROM projects p 
             LEFT JOIN project_details pd ON p.id = pd.project_id 
             LEFT JOIN customers c ON pd.customer_id = c.id 
             WHERE p.contract_number = $1`,
            [contractNum]
        );

        if (projectResult.rows.length === 0) {
            console.log('Project not found');
            return;
        }

        const project = projectResult.rows[0];
        const projectId = project.real_project_id;
        console.log(`Resolved internal Project ID: ${projectId}`);

        // Fetch latest floor plan
        const floorPlanResult = await query(
            "SELECT file_path FROM photos WHERE project_id = $1 AND photo_type = 'floor_plan' ORDER BY taken_at DESC LIMIT 1",
            [projectId]
        );

        let floorPlanBase64 = '';
        if (floorPlanResult.rows.length > 0) {
            const filePath = floorPlanResult.rows[0].file_path;
            if (fs.existsSync(filePath)) {
                console.log(`Found floor plan at ${filePath}`);
                const buffer = fs.readFileSync(filePath);
                floorPlanBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
            } else {
                console.log(`Floor plan file NOT FOUND at ${filePath}`);
            }
        } else {
            console.log('No floor plan found in DB for this project.');
        }

        const data = {
            ...project,
            alaprajz: floorPlanBase64
        };

        const result = await documentGenerator.generate('kivitelezoi_nyilatkozat', data);
        console.log('Document generated successfully:', result.fileName);
        console.log('File path:', result.filePath);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testFloorPlanGen();
