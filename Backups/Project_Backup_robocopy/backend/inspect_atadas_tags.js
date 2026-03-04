const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/atadas_atveteli.docx');
console.log(`\n--- TAGS IN atadas_atveteli.docx ---`);

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();
    const cleanXml = xml.replace(/<[^>]+>/g, '');
    const matches = cleanXml.match(/\[\[(.*?)\]\]/g);

    if (matches) {
        const uniqueTags = [...new Set(matches)];
        uniqueTags.sort();
        uniqueTags.forEach(t => console.log(t));
    } else {
        console.log('No tags found.');
    }
} catch (e) {
    console.error('Error:', e.message);
}
