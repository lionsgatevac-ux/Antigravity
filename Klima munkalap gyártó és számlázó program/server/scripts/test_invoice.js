require('dotenv').config({ path: '../.env' });
const { createInvoice } = require('../utils/szamlazz');
const fs = require('fs');
const path = require('path');

// Mock worksheet data
const worksheet = {
    id: 'TEST-' + Date.now(),
    workDate: new Date().toISOString().split('T')[0],
    clientName: 'Test Client',
    clientAddress: '1234 Test City, Test Street 1.',
    clientEmail: 'test@example.com',
    laborFee: 100, // Minimal amount for testing
    materialCost: 0
};

async function runTest() {
    console.log('--- Starting Invoice Generation Test ---');
    console.log('Worksheet Data:', worksheet);

    try {
        const settingsPath = path.join(__dirname, '../data/settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            console.log('Settings loaded. API Key length:', settings.szamlazzKey ? settings.szamlazzKey.length : 'MISSING');
        } else {
            console.log('Settings file not found at:', settingsPath);
        }

        const pdfBuffer = await createInvoice(worksheet);

        if (pdfBuffer) {
            console.log('SUCCESS: Invoice PDF generated.');
            console.log('Buffer size:', pdfBuffer.length);
            const outputPath = path.join(__dirname, 'test_invoice.pdf');
            fs.writeFileSync(outputPath, pdfBuffer);
            console.log(`Saved test invoice to: ${outputPath}`);
        } else {
            console.error('FAILURE: Invoice generation returned no data.');
        }

    } catch (error) {
        console.error('--- TEST FAILED ---');
        console.error('Error message:', error.message);

        const logContent = [
            `Error Message: ${error.message}`,
            '--- Response Headers ---',
            error.response ? JSON.stringify(error.response.headers, null, 2) : 'No response headers',
            '--- Response Data ---',
            error.response ? error.response.data.toString() : 'No response data'
        ].join('\n');

        fs.writeFileSync(path.join(__dirname, 'invoice_test_error.log'), logContent);
        console.log('Error details saved to invoice_test_error.log');
    }
}

runTest();
