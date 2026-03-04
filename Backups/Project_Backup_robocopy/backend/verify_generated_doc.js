const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generated/kivitelezesi_szerzodes_CN-TEST-DIRTY.docx');

try {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    console.log('--- GENERATED DOC INSPECTION ---');

    // Check for raw base64 string
    const base64Fragment = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    if (xml.includes(base64Fragment)) {
        console.log('FAIL: Raw base64 string FOUND in document XML text!');
        console.log('This confirms the bug: Signature is rendered as text.');
    } else {
        console.log('SUCCESS: Raw base64 string NOT found in document XML text.');
    }

    // Check for drawing element near signature
    if (xml.includes('<w:drawing>')) {
        console.log('INFO: Found <w:drawing> tags - images likely present.');
    } else {
        console.log('WARNING: No <w:drawing> tags found - images might be missing entirely?');
    }

    // Check ALAIRAS specifics
    const alairasStart = xml.indexOf('alairas');
    if (alairasStart !== -1) {
        console.log('Context around "alairas" (if literal tag remains):');
        console.log(xml.substring(alairasStart - 50, alairasStart + 50));
    }

} catch (e) {
    console.error('Error:', e);
}
