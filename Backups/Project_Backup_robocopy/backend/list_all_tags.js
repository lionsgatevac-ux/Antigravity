const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Simplistic regex on the whole XML content
    // Note: Docxtemplater tags might be split across <w:t> tags. 
    // But usually [[var]] is kept together if typed quickly or copy-pasted.

    const xml = zip.files['word/document.xml'].asText();
    const matches = xml.match(/\[\[(.*?)\]\]/g);

    if (matches) {
        console.log('--- ALL TAGS FOUND ---');
        // Filter unique
        const uniqueTags = [...new Set(matches)];
        uniqueTags.sort();
        uniqueTags.forEach(t => console.log(t));
    } else {
        console.log('No tags found via simple regex.');
    }

} catch (e) {
    console.error('Error:', e);
}
