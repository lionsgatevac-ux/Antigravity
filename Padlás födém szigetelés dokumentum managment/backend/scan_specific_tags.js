const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Extract text and find tags
    const text = zip.files['word/document.xml'].asText();
    const tagRegex = /\[\[(?<tag>[^\]]+)\]\]/g;

    console.log('--- Searching for relevant tags ---');
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        const tag = match[1];
        if (tag.includes('munka') || tag.includes('dij') || tag.includes('betu')) {
            console.log(`Found relevant tag: [[${tag}]]`);
        }
    }

} catch (e) {
    console.error('Error:', e);
}
