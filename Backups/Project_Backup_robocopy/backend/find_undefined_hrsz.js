const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    // Check for "undefined" string
    const index = xml.indexOf('undefined');
    if (index !== -1) {
        console.log('FOUND "undefined" text in XML!');
        console.log('Context:');
        console.log(xml.substring(Math.max(0, index - 100), Math.min(xml.length, index + 100)));
    } else {
        console.log('"undefined" not found in XML text.');
    }

    // Check HRSZ context
    const hrszIndex = xml.indexOf('hrsz.-ú');
    if (hrszIndex !== -1) {
        console.log('\nFOUND "hrsz.-ú" text in XML!');
        console.log('Context:');
        console.log(xml.substring(Math.max(0, hrszIndex - 100), Math.min(xml.length, hrszIndex + 100)));
    } else {
        console.log('"hrsz.-ú" not found in XML.');
    }

} catch (e) {
    console.error('Error:', e);
}
