const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templateName = 'megallapodas_hem.docx';
const templatePath = path.join(__dirname, '../templates', templateName);

console.log(`Debug script for: ${templateName}`);

try {
    if (!fs.existsSync(templatePath)) {
        console.error('Template NOT FOUND at:', templatePath);
        process.exit(1);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    console.log('\n--- XML Search ---');
    // Search for all signature related tags
    const searchTerms = ['alairasugyfel', '%alairasugyfel', 'alairaskivitelezo', '%alairaskivitelezo'];

    let contextOutput = '';

    searchTerms.forEach(term => {
        let idx = xml.indexOf(term);
        while (idx !== -1) {
            console.log(`FOUND "${term}" at index ${idx}`);
            contextOutput += `\nFOUND "${term}" at index ${idx}\n`;
            contextOutput += 'CONTEXT:\n';
            contextOutput += xml.substring(Math.max(0, idx - 200), Math.min(xml.length, idx + 200)) + '\n----------------\n';

            // Search for next occurrence
            idx = xml.indexOf(term, idx + 1);
        }
    });

    fs.writeFileSync(path.join(__dirname, 'debug_hem_context.txt'), contextOutput);
    console.log('Saved debug_hem_context.txt');

} catch (e) {
    console.error('CRITICAL ERROR:', e);
}
