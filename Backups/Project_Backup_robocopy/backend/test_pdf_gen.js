const documentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');

async function testPdfGeneration() {
    console.log('Starting PDF generation test...');

    // Mock data based on a real project structure
    const mockData = {
        contract_number: 'TEST-2024-001',
        contract_date: new Date(),
        customer_name: 'Teszt Elek',
        customer_address: {
            postalCode: '1234',
            city: 'Tesztváros',
            street: 'Teszt u.',
            houseNumber: '10'
        },
        net_amount: 1000000,
        labor_cost: 200000,
        owner_role: 'admin',
        // Minimal required fields
        structure_type: 'fa',
        insulation_thickness: 25
    };

    try {
        console.log('Generating PDF for kivitelezesi_szerzodes...');
        const result = await documentGenerator.generate('kivitelezesi_szerzodes', mockData, 'pdf');

        console.log('Generation result:', result);

        if (fs.existsSync(result.filePath)) {
            console.log('✅ PDF file created successfully at:', result.filePath);
            const stats = fs.statSync(result.filePath);
            console.log(`File size: ${stats.size} bytes`);
            if (stats.size > 0) {
                console.log('Test PASSED');
            } else {
                console.error('Test FAILED: File is empty');
            }
        } else {
            console.error('Test FAILED: File does not exist at path');
        }

    } catch (error) {
        console.error('Test FAILED with error:', error);
    }
}

testPdfGeneration();
