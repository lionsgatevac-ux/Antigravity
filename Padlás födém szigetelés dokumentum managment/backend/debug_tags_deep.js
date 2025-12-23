const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

const points = [188177, 192430];

const output = [];
points.forEach(idx => {
    const start = idx;
    const end = Math.min(xml.length, idx + 500);
    const context = xml.substring(start, end);
    output.push(`\n--- CTX at ${idx} ---\n${context}`);
});
fs.writeFileSync(path.join(__dirname, 'tags_context.txt'), output.join('\n'));
console.log('Written to tags_context.txt');
