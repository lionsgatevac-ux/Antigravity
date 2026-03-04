const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const filePath = path.join(__dirname, '..', 'templates', 'kivitelezoi_nyilatkozat.docx');
console.log(`Inspecting tags in: ${filePath}`);

if (!fs.existsSync(filePath)) {
    console.error(`File not found!`);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml').asText();

// Regex to find [[...]] tags
const regex = /\[\[(.*?)\]\]/g;
let match;
const tags = new Set();

while ((match = regex.exec(xml)) !== null) {
    tags.add(match[1]);
}

const tagList = Array.from(tags).sort();
console.log('--- Found Tags ---');
console.log(tagList);
fs.writeFileSync(path.join(__dirname, '..', 'tags.json'), JSON.stringify(tagList, null, 2));
console.log('Tags written to tags.json');
