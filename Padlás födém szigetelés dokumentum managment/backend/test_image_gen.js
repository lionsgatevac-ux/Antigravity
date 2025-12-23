const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');
const path = require('path');

console.log('Starting test...');

try {
    const content = fs.readFileSync(path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx'), 'binary');
    const zip = new PizZip(content);

    const opts = {};
    opts.centered = false;
    opts.getImage = function (tagValue, tagName) {
        console.log('getImage called for', tagName);
        return Buffer.from(tagValue, 'base64');
    };
    opts.getSize = function (img, tagValue, tagName) {
        console.log('getSize called for', tagName);
        return [100, 100];
    };

    const imageModule = new ImageModule(opts);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule],
        delimiters: { start: '[[', end: ']]' }
    });

    // Mock data with a tiny base64 image
    const data = {
        alairasugyfel: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        contract_number: "TEST-001"
    };

    doc.render(data);

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(path.join(__dirname, 'test_output.docx'), buf);
    console.log('Test successful, test_output.docx created.');

} catch (e) {
    console.error('Test failed:', e);
}
