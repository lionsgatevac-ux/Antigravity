const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesToCheck = [
    'kivitelezesi_szerzodes.docx',
    'atadas_atveteli.docx',
    'megallapodas_hem.docx',
    'kivitelezoi_nyilatkozat.docx'
];

templatesToCheck.forEach(filename => {
    console.log(`\n\n=== CHECKING: ${filename} ===`);
    const templatePath = path.join(__dirname, '../templates', filename);

    if (!fs.existsSync(templatePath)) {
        console.log('FILE NOT FOUND!');
        return;
    }

    try {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const xml = zip.files['word/document.xml'].asText();

        // Extract all tags [[...]]
        const regex = /\[\[(.*?)\]\]/g;
        let match;
        const tags = [];
        while ((match = regex.exec(xml)) !== null) {
            tags.push(match[1]); // Content inside [[ ]]
        }

        // Check specific signature tags
        const sigTags = tags.filter(t => t.includes('alairas') || t.includes('alaprajz'));

        if (sigTags.length === 0) {
            console.log('No signature/alaprajz tags found.');
        } else {
            sigTags.forEach(tag => {
                const trimmed = tag.trim();
                // Check if it starts with % (ignoring whitespace for the check, though strictly it should be [[%tag]])
                if (trimmed.startsWith('%')) {
                    console.log(`✅ CORRECT: [[${tag}]]`);
                } else {
                    console.log(`❌ INCORRECT: [[${tag}]] (Missing %)`);
                }
            });
        }

    } catch (e) {
        console.error('Error reading file:', e);
    }
});
