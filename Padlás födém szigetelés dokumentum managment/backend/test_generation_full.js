const DocumentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

async function testGeneration() {
    console.log('--- STARTING GENERATION TEST ---');

    // 1. Setup Mock Data
    const mockData = {
        invoice_number: 'TEST-2025-001',
        contract_date: new Date(),
        // Customer
        customer_name: 'Teszt Elek',
        customer_email: 'teszt@elek.hu',
        customer_phone: '06301234567',
        customer_address: '1234 Budapest, Teszt u. 1.',
        mother_name: 'Teszt Anyu',
        id_card_number: '123456AB',
        tax_id: '87654321',

        // Property
        postal_code: '1234',
        city: 'Budapest',
        street: 'Teszt utca',
        house_number: '1',
        lot_number: '1234/5', // hrsz

        // Technical
        structure_type: 'fa',
        structure_thickness: '15',
        unheated_space_type: 'garázs',
        unheated_space_area: '20',
        foil_type: 'Párazáró fólia',
        insulation_type: 'Üveggyapot',
        attic_door_insulated: true,

        // Financial
        net_amount: 250000,
        labor_cost: 50000,

        // Signatures (simulated base64, small red dot)
        signature_customer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        signature_contractor: ''
    };

    // 2. Use Generator Instance
    const generator = DocumentGenerator;

    // 3. Generate
    try {
        console.log('Generating document...');
        const result = await generator.generate('kivitelezesi_szerzodes', mockData);
        console.log('Generation success!', result.filePath);

        // 4. Verify Output Content
        const content = fs.readFileSync(result.filePath, 'binary');
        const zip = new PizZip(content);
        const xml = zip.files['word/document.xml'].asText();

        // Check for specific replacement success
        const checks = [
            { name: 'Customer Email', expected: 'teszt@elek.hu', tagGuess: '[[email]]' },
            { name: 'HRSZ', expected: '1234/5', tagGuess: '[[hrsz]]' },
            { name: 'Labor Cost Text', expected: 'ötvenezer', tagGuess: '[[munkadijbetuvel]]' },
            { name: 'Undefined Check', expected: 'undefined', shouldNotExist: true }
        ];

        console.log('\n--- VERIFICATION RESULTS ---');
        checks.forEach(check => {
            if (check.shouldNotExist) {
                if (xml.includes(check.expected)) {
                    console.error(`[FAIL] Found forbidden text: "${check.expected}"`);
                    // Print context
                    const idx = xml.indexOf(check.expected);
                    console.log(`Context: ...${xml.substring(idx - 50, idx + 50)}...`);
                } else {
                    console.log(`[PASS] Forbidden text "${check.expected}" not found.`);
                }
            } else {
                if (xml.includes(check.expected)) {
                    console.log(`[PASS] Found expected value: "${check.expected}"`);
                } else {
                    console.error(`[FAIL] Expected "${check.expected}" NOT found.`);
                    // Check if tag remains
                    if (xml.includes(check.tagGuess)) {
                        console.error(`       Tag "${check.tagGuess}" remains in document!`);
                    } else {
                        // Check for fractured tag
                        // simple check for variable name
                        const varName = check.tagGuess.replace(/\[|\]/g, '');
                        if (xml.includes(varName)) {
                            console.error(`       Variable name "${varName}" found in XML (likely fractured tag).`);
                        } else {
                            console.error(`       Variable "${varName}" disappeared entirely?`);
                        }
                    }
                }
            }
        });

    } catch (e) {
        console.error('Generation Failed:', e);
    }
}

testGeneration();
