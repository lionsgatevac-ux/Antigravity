// Debug document generation data flow
const Project = require('./backend/models/Project');
const documentGenerator = require('./backend/services/documentGenerator');

async function debugDocumentGeneration() {
    try {
        // Get the latest project
        const db = require('./backend/config/database');
        const result = await db.query(
            `SELECT p.id, p.contract_number 
             FROM projects p 
             ORDER BY p.created_at DESC 
             LIMIT 1`
        );

        if (result.rows.length === 0) {
            console.log('❌ No projects found');
            return;
        }

        const projectId = result.rows[0].id;
        const contractNumber = result.rows[0].contract_number;

        const fs = require('fs');
        const output = [];
        const log = (msg) => {
            console.log(msg);
            output.push(msg);
        };

        log(`\n📋 Testing project: ${contractNumber} (ID: ${projectId})\n`);

        // Step 1: Get project data from database
        const projectData = await Project.findById(projectId);
        log('1️⃣ PROJECT DATA FROM DATABASE:');
        log(`   structure_type: ${projectData.structure_type}`);
        log(`   structure_thickness: ${projectData.structure_thickness}`);
        log(`   unheated_space_type: ${projectData.unheated_space_type}`);
        log(`   unheated_space_area: ${projectData.unheated_space_area}`);
        log(`   unheated_space_name: ${projectData.unheated_space_name}`);

        // Step 2: Prepare template data (simulating documents.js)
        const templateData = {
            contract_number: projectData.contract_number,
            customer_name: projectData.full_name,
            structure_type: projectData.structure_type,
            structure_thickness: projectData.structure_thickness,
            unheated_space_type: projectData.unheated_space_type,
            unheated_space_area: projectData.unheated_space_area,
            unheated_space_name: projectData.unheated_space_name,
            gross_area: projectData.gross_area,
            net_area: projectData.net_area
        };

        log('\n2️⃣ TEMPLATE DATA (what we send to documentGenerator):');
        log(`   structure_type: ${templateData.structure_type}`);
        log(`   structure_thickness: ${templateData.structure_thickness}`);
        log(`   unheated_space_type: ${templateData.unheated_space_type}`);
        log(`   unheated_space_area: ${templateData.unheated_space_area}`);

        // Step 3: Check what prepareData returns
        const preparedData = documentGenerator.prepareData(templateData);
        log('\n3️⃣ PREPARED DATA (after documentGenerator.prepareData):');
        log(`   fa: ${preparedData.fa}`);
        log(`   facm: ${preparedData.facm}`);
        log(`   acel: ${preparedData.acel}`);
        log(`   acelcm: ${preparedData.acelcm}`);
        log(`   garazs: ${preparedData.garazs}`);
        log(`   garazsnm: ${preparedData.garazsnm}`);
        log(`   bármi: ${preparedData['bármi']}`);
        log(`   bárminm: ${preparedData['bárminm']}`);
        log(`   vasbeton: ${preparedData.vasbeton}`);
        log(`   vasbetoncm: ${preparedData.vasbetoncm}`);
        log(`   monolit: ${preparedData.monolit}`);
        log(`   monolitcm: ${preparedData.monolitcm}`);
        log(`   egyéb: ${preparedData['egyéb']}`);
        log(`   egyébnm: ${preparedData['egyébnm']}`);
        log(`   egyébnev: ${preparedData['egyébnev']}`);

        fs.writeFileSync('debug_output.txt', output.join('\n'));
        console.log('\n✅ Debug output saved to debug_output.txt');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

debugDocumentGeneration();
