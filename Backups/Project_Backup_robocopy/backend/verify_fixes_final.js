const documentGenerator = require('./services/documentGenerator');

const testData = {
    customer_id_number: '123456AB',
    net_amount: 1500000,
    energy_saving_gj: 46.10,
    hem_value: 200000,
    customer_signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    alaprajz: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
};

const processedData = documentGenerator.prepareData(testData);

console.log('--- Verification Results ---');
console.log('szemelyi (expected: 123456AB):', processedData.szemelyi);
console.log('brszamoltertek (expected: 1 500 000 Ft):', processedData.brszamoltertek);
console.log('gj (expected: 46.1):', processedData.gj);
console.log('alaprajz (length > 0):', processedData.alaprajz?.length);

if (processedData.szemelyi === '123456AB' &&
    processedData.brszamoltertek === '1 500 000 Ft' &&
    processedData.gj === 46.1) {
    console.log('\n✅ ALL FIELDS VERIFIED SUCCESSFULLY');
} else {
    console.log('\n❌ VERIFICATION FAILED');
    process.exit(1);
}
