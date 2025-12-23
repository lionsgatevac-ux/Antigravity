const documentGenerator = require('./services/documentGenerator');
const fs = require('fs');
const path = require('path');

// Mock base64 blue signature (a simple dot or small line)
const mockSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAAACXBIWXMAAAsTAAALEwEAmpwYAAABtElEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGP52sAAEqLg4yAAAAAElFTkSuQmCC";

const mockData = {
    contract_number: 'TEST-001',
    customer_name: 'Teszt Elek',
    customer_signature_data: mockSignature,
    contractor_signature_data: mockSignature,
    contract_date: new Date(),
    work_start_date: new Date(),
    work_end_date: new Date(),
    handover_date: new Date(),
    net_amount: 100000,
    attic_door_insulated: true
};

async function test() {
    try {
        console.log('Generating document...');
        const result = await documentGenerator.generate('kivitelezoi_nyilatkozat', mockData);
        console.log('Success:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
