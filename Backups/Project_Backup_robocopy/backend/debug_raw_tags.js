const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates\\atadas_atveteli.docx';

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    let xml = zip.files['word/document.xml'].asText();

    console.log('--- EXHAUSTIVE RAW TAG SEARCH ---');
    let index = 0;
    while ((index = xml.indexOf('[[', index)) !== -1) {
        let endIndex = xml.indexOf(']]', index);
        if (endIndex === -1) break;

        const match = xml.substring(index, endIndex + 2);
        console.log(`\n--- Match at index ${index} ---`);
        console.log(`MATCH_START`);
        console.log(match);
        console.log(`MATCH_END`);
        console.log(`Cleaned: [[${match.replace(/<[^>]+>/g, '')}]]`);

        index = endIndex + 2;
        if (index > 100000) break; // Limit to first few tags
    }

} catch (e) {
    console.error(e);
}
