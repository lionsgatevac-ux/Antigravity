const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();
    const cleanXml = xml.replace(/<[^>]+>/g, ' ');

    // Output the first 10000 characters to a file for me to read
    fs.writeFileSync('hem_text_dump.txt', cleanXml);
    console.log('Text dump written to hem_text_dump.txt');

} catch (e) {
    console.error('Error:', e.message);
}
