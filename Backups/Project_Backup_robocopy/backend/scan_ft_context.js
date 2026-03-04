const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();
    const text = xml.replace(/<[^>]+>/g, '');

    let pos = text.indexOf('Ft');
    while (pos !== -1) {
        console.log('--- Found Ft ---');
        console.log(text.substring(Math.max(0, pos - 50), pos + 10));
        pos = text.indexOf('Ft', pos + 1);
    }

} catch (e) {
    console.error('Error:', e);
}
