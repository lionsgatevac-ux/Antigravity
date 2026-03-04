const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    // Check for "undefined"
    if (xml.includes('undefined')) {
        console.log('FOUND "undefined" string at index ' + xml.indexOf('undefined'));
    } else {
        console.log('"undefined" text NOT found in XML.');
    }

    // Check for "hrsz.-ú"
    const hrszIdx = xml.indexOf('hrsz.-ú');
    if (hrszIdx !== -1) {
        console.log('FOUND "hrsz.-ú". Context (-50, +50 chars):');
        console.log(xml.substring(hrszIdx - 50, hrszIdx + 50));
    } else {
        console.log('"hrsz.-ú" NOT found.');
    }

} catch (e) {
    console.error('Error:', e);
}
