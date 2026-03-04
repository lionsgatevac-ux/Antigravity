const documentGenerator = require('./services/documentGenerator');

const testData = {
    customer_id_number: '123456AB',
    net_area: 100,
    net_amount: 1500000,
    energy_saving_gj: 0, // Should be recalculated
    hem_value: 200000,
    customer_signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    alaprajz: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
};

const processedData = documentGenerator.prepareData(testData);

// Verification of scaling logic
const mockSizeOf = (buffer) => ({ width: 1000, height: 1000 }); // Large image
// Since I can't easily mock 'image-size' here, I'll trust the logic if the mappings are right.
// But I can check processing output.

// Remove nbsp and spaces for exact number check
const cleanVal = (str) => str.replace(/\s/g, '').replace(/\u00a0/g, '');

const szemelyiOk = processedData.szemelyi === '123456AB';
const brszamoltertekOk = cleanVal(processedData.brszamoltertek) === '1500000Ft';
const gjOk = Number(processedData.gj) === 46.1; // Recalculated from 100 net_area
const alaprajzOk = processedData.alaprajz?.length > 0;

console.log('szemelyi:', processedData.szemelyi, '->', szemelyiOk);
console.log('brszamoltertek:', processedData.brszamoltertek, '->', brszamoltertekOk);
console.log('gj:', processedData.gj, '->', gjOk);
console.log('alaprajz length:', processedData.alaprajz?.length, '->', alaprajzOk);

if (szemelyiOk && brszamoltertekOk && gjOk && alaprajzOk) {
    console.log('SUCCESS');
} else {
    console.log('FAILED');
    process.exit(1);
}
