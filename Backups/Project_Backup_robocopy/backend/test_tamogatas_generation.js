const documentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

async function runTest() {
    const mockData = {
        customer_name: "Támogatás Teszt Elek",
        customer_birth_name: "Támogatás Teszt Elek Születési",
        customer_mother_name: "Anyja Neve Teszt",
        id_number: "123456AB",
        customer_address: {
            postalCode: "1234",
            city: "Budapest",
            street: "Teszt utca",
            houseNumber: "42"
        },
        hrsz: "1234/5",
        contract_date: new Date(),

        // Signatures
        customer_signature_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",

        // Other fields that might be used
        owner_role: 'admin'
    };

    console.log('Generating tamogatas_igenylo...');

    try {
        const result = await documentGenerator.generate('tamogatas_igenylo', mockData);
        console.log('✅ Document generated successfully:', result.filePath);

        // Verify content
        const content = fs.readFileSync(result.filePath, 'binary');
        const zip = new PizZip(content);
        const xml = zip.files['word/document.xml'].asText();

        // Check for key substitutions
        const checks = {
            'Név': 'Támogatás Teszt Elek',
            'Anyja neve': 'Anyja Neve Teszt',
            'Személyi': '123456AB',
            'HRSZ': '1234/5'
        };

        let allPassed = true;
        for (const [key, value] of Object.entries(checks)) {
            if (xml.includes(value)) {
                console.log(`✅ Found ${key}: ${value}`);
            } else {
                console.log(`❌ Missing ${key}: ${value}`);
                allPassed = false;
            }
        }

        // Check for signature tag replacement (it should NOT be in the text if replaced by image)
        if (xml.includes('[[%alairas]]')) {
            console.log('❌ Signature tag [[%alairas]] found in text (Image replacement failed)');
            allPassed = false;
        } else {
            console.log('✅ Signature tag [[%alairas]] replaced (likely successful)');
        }

        if (xml.includes('[[alairas]]')) {
            console.log('❌ Signature tag [[alairas]] found in text (Text replacement failed)');
            allPassed = false;
        } else {
            console.log('✅ Signature tag [[alairas]] replaced/removed');
        }

    } catch (e) {
        console.error('❌ Test failed:', e);
    }
}

runTest();
