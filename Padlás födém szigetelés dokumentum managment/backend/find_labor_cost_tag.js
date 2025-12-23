const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const xml = zip.files['word/document.xml'].asText();

    // Search for "munkadíj" and show surrounding text and tags
    const index = xml.indexOf('munkadíj');
    if (index !== -1) {
        console.log('Found "munkadíj" at index:', index);
        const start = Math.max(0, index - 500);
        const end = Math.min(xml.length, index + 1000); // larger context
        const context = xml.substring(start, end);

        console.log('--- CONTEXT ---');
        console.log(context);
        console.log('--- END CONTEXT ---');

        // Find all tags in this context
        const tagRegex = /\[\[(?<tag>[^\]]+)\]\]/g;
        let match;
        while ((match = tagRegex.exec(context)) !== null) {
            console.log(`Found tag in context: [[${match[1]}]]`);
        }
    } else {
        console.log('"munkadíj" not found in XML text (might be encoded or split).');
    }

} catch (e) {
    console.error('Error:', e);
}
