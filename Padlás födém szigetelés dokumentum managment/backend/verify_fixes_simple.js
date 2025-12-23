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

process.stdout.write('szemelyi: ' + processedData.szemelyi + '\n');
process.stdout.write('brszamoltertek: ' + processedData.brszamoltertek + '\n');
process.stdout.write('gj: ' + processedData.gj + '\n');
process.stdout.write('alaprajz_ok: ' + (processedData.alaprajz?.length > 0) + '\n');

if (processedData.szemelyi === '123456AB' &&
    processedData.brszamoltertek === '1 500 000 Ft' &&
    processedData.gj === 46.1) {
    process.stdout.write('SUCCESS\n');
} else {
    process.stdout.write('FAILED\n');
    process.exit(1);
}
