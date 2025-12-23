const documentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');

const mockData = {
    // Basic fields
    customer_name: "Teszt Elek",
    contract_number: "HEM-TEST-001",
    contract_date: new Date(),

    // Signatures
    customer_signature_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    contractor_signature_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",

    // Other fields required by HEM
    project_id: "123",
    address: { city: "Budapest", street: "Fő utca", houseNumber: "1" },
    property_address: { city: "Budapest", street: "Fő utca", houseNumber: "1" },
    hrsz: "1234/5"
};

async function run() {
    try {
        console.log('Generating HEM document...');
        const result = await documentGenerator.generate('megallapodas_hem', mockData);
        console.log('Generation successful:', result.filePath);

        // Verify output
        const content = fs.readFileSync(result.filePath, 'binary');
        const PizZip = require('pizzip');
        const zip = new PizZip(content);
        const xml = zip.files['word/document.xml'].asText();

        if (xml.includes('data:image')) {
            console.error('FAIL: Output contains raw base64 string!');
        } else {
            const drawingCount = (xml.match(/<w:drawing>/g) || []).length;
            if (drawingCount >= 2) {
                console.log(`SUCCESS: Output contains ${drawingCount} <w:drawing> tags. (Expected 2 signatures)`);
            } else if (drawingCount === 1) {
                console.log(`WARNING: Output contains only 1 <w:drawing> tag. (Expected 2 signatures: ügyfél + kivitelező)`);
            } else {
                console.log('FAIL: No drawing tags found.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
