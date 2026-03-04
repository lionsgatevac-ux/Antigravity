const axios = require('axios');
const fs = require('fs');
const path = require('path');
const documentGenerator = require('./services/documentGenerator');

// Fetch project 1 (assuming that's what user is testing with)
async function testWithRealData() {
    try {
        // Get project data from API
        const response = await axios.get('http://localhost:3000/api/projects/1');
        const project = response.data.data;

        console.log('Project Data:');
        console.log('- customer_signature_data:', project.customer_signature_data ? project.customer_signature_data.substring(0, 50) + '...' : 'NULL');
        console.log('- contractor_signature_data:', project.contractor_signature_data ? project.contractor_signature_data.substring(0, 50) + '...' : 'NULL');

        // Check if signatures are valid Base64
        if (project.customer_signature_data) {
            const isValid = /^data:image\/(png|jpeg|jpg);base64,/.test(project.customer_signature_data);
            console.log('- Customer sig format valid:', isValid);
        }

        if (project.contractor_signature_data) {
            const isValid = /^data:image\/(png|jpeg|jpg);base64,/.test(project.contractor_signature_data);
            console.log('- Contractor sig format valid:', isValid);
        }

        // Prepare data same way as routes/documents.js
        const templateData = {
            contract_number: project.contract_number,
            contract_date: new Date(),
            customer_name: project.full_name,
            customer_signature_data: project.customer_signature_data,
            contractor_signature_data: project.contractor_signature_data,
            // Add other required fields...
        };

        console.log('\nGenerating document with REAL data...');
        const result = await documentGenerator.generate('megallapodas_hem', templateData);
        console.log('Generated:', result.fileName);

        // Verify output
        const PizZip = require('pizzip');
        const genContent = fs.readFileSync(result.filePath, 'binary');
        const genZip = new PizZip(genContent);
        const genXml = genZip.files['word/document.xml'].asText();

        if (genXml.includes('data:image')) {
            console.error('\n❌ FAIL: Generated document contains raw base64!');
        } else {
            const drawingCount = (genXml.match(/<w:drawing>/g) || []).length;
            console.log(`\n✅ SUCCESS: Found ${drawingCount} images`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testWithRealData();
