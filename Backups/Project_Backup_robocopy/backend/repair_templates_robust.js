const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const templates = [
    'kivitelezesi_szerzodes.docx',
    'atadas_atveteli.docx',
    'kivitelezoi_nyilatkozat.docx',
    'megallapodas_hem.docx'
];

function cleanXmlTags(str) {
    return str.replace(/<[^>]+>/g, '');
}

templates.forEach(templateName => {
    const templatePath = path.join(templatesDir, templateName);
    if (!fs.existsSync(templatePath)) {
        console.log(`Skipping ${templateName}: Not found`);
        return;
    }

    console.log(`\nRepairing ${templateName}...`);
    try {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        let xml = zip.files['word/document.xml'].asText();

        let repairs = 0;
        // Robust regex for docxtemplater tags that might be fractured by XML tags
        // This matches [[ followed by anything (non-greedily) until ]]
        const tagRegex = /\[\[((?:(?!\]\]).)+?)\]\]/gs;

        const repairedXml = xml.replace(tagRegex, (match, inner) => {
            const cleaned = cleanXmlTags(inner).trim();
            if (cleaned !== inner && cleaned.length < 100) {
                // Check if it's a structural tag break (p, tc, table)
                if (inner.includes('w:p') || inner.includes('w:tc') || inner.includes('w:tbl')) {
                    console.log(`  Skipping structural tag break: ${cleaned}`);
                    return match;
                }
                console.log(`  Repairing: [[...]] -> [[${cleaned}]]`);
                repairs++;
                return `[[${cleaned}]]`;
            }
            return match;
        });

        if (repairs > 0) {
            zip.file('word/document.xml', repairedXml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(templatePath, buffer);
            console.log(`  Success! Repaired ${repairs} tags in ${templateName}.`);
        } else {
            console.log(`  No fractured tags found in ${templateName}.`);
        }
    } catch (err) {
        console.error(`  Error repairing ${templateName}:`, err.message);
    }
});
