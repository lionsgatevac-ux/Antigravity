const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    // Naive strip tags to just see the text content
    const text = xml.replace(/<[^>]+>/g, '');

    console.log('--- PLAIN TEXT EXTRACT ---');
    // Find context around "munkadíj" in plain text
    const index = text.indexOf('munkadíj');
    if (index !== -1) {
        console.log(text.substring(index - 100, index + 300));
    } else {
        console.log('Word "munkadíj" not found in plain text (formatting issues?)');
    }

    console.log('\n--- LOOKING FOR BRACKETS IN PLAIN TEXT ---');
    const matches = text.match(/\[\[.*?\]\]/g);
    if (matches) {
        const unique = [...new Set(matches)].sort();
        unique.forEach(m => console.log(m));
    }

} catch (e) {
    console.error('Error:', e);
}
