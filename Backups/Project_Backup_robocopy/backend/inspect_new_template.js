const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const templateName = 'Támogatás egyszeri igénylessrol nyilatkozat.docx';
const templatePath = path.join(__dirname, '..', 'templates', templateName);

console.log(`Analyzing ${templateName} using Docxtemplater inspection...`);

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    const text = doc.getFullText();
    console.log('--- Full Text Extraction ---');
    console.log(text);

    console.log('\n--- Variable Detection ---');
    // Using internal API to inspect variables if available, or just regex on full text which is cleaner
    // getFullText() returns text without XML tags, so regex works better here!

    const regex = /\[\[(.*?)\]\]/g;
    let match;
    const tags = new Set();

    while ((match = regex.exec(text)) !== null) {
        tags.add(match[1]);
    }

    if (tags.size > 0) {
        console.log('Found tags:');
        Array.from(tags).sort().forEach(tag => console.log(tag));
    } else {
        console.log('No tags found in plain text. Dumping XML for manual check...');
        // const docXml = zip.files['word/document.xml'].asText();
        // console.log(docXml);
    }

    // Also try to inspect using inspect module if possible or just try to render with empty object and catch errors
    try {
        doc.render({});
    } catch (error) {
        if (error.properties && error.properties.errors) {
            console.log('\n--- Docxtemplater Validation Errors (Missing Tags) ---');
            error.properties.errors.forEach(e => {
                console.log(e.id, e.name, e.properties ? e.properties : '');
            });
        }
    }

} catch (error) {
    console.error('Error:', error);
}
