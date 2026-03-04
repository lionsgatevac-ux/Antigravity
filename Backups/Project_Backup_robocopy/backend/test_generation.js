const documentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

async function runTest() {
    const mockData = {
        customer_name: "Teszt Elek",
        hrsz: "undefined", // DIRTY DATA
        contract_number: "CN-TEST-DIRTY",
        net_amount: 123456,
        customer_address: {
            postalCode: "undefined",
            city: "undefined",
            street: "Normal Street",
            houseNumber: "12"
        },
        property_address: {
            postalCode: "undefined",
            city: "undefined"
        },
        customer_signature_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        contractor_signature_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        // ... fill minimum required
    };

    try {
        const result = await documentGenerator.generate('kivitelezesi_szerzodes', mockData);
        console.log('Document generated:', result.filePath);

        // Read generated file to check content
        const content = fs.readFileSync(result.filePath, 'binary');
        const zip = new PizZip(content);
        const xml = zip.files['word/document.xml'].asText();

        if (xml.includes('undefined')) {
            console.log('FAIL: "undefined" found in generated document.');
            const idx = xml.indexOf('undefined');
            console.log('Context:', xml.substring(idx - 50, idx + 50));
        } else {
            console.log('PASS: No "undefined" found in generated document.');
        }

        if (xml.includes('HRSZ-TEST-123')) {
            console.log('PASS: HRSZ found in generated document.');
        } else {
            console.log('FAIL: HRSZ missing from generated document.');
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
