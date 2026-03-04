const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');
console.log(`\n--- TAGS IN megallapodas_hem.docx ---`);

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

    // Also look for "GJ" in the clean text to see what tag is near it
    const index = cleanXml.indexOf('GJ');
    if (index !== -1) {
        console.log('\n--- TEXT AROUND GJ ---');
        console.log(cleanXml.substring(index - 100, index + 100));
    }

} catch (e) {
    console.error('Error:', e.message);
}
