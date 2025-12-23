const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const filePath = path.join(__dirname, '..', 'templates', 'kivitelezesi_szerzodes.docx');
console.log(`Dumping XML from: ${filePath}`);

if (!fs.existsSync(filePath)) {
    console.error(`File not found!`);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml').asText();

fs.writeFileSync(path.join(__dirname, 'template_dump.xml'), xml);
console.log('XML dumped to template_dump.xml');
