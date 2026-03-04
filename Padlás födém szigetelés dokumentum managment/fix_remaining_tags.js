const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const file = 'kivitelezesi_szerzodes.docx';
const filePath = path.join(__dirname, 'templates', file);

if (fs.existsSync(filePath)) {
    console.log(`Processing ${file}...`);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        let xml = zip.file('word/document.xml').asText();
        let changed = false;

        // Strategy: find any [[...]] block containing 'brszig' or 'kemeny' and '%'
        // and replace it with clean [[tag]]

        // Match matching tags first
        const matches = xml.match(/\[\[.*?\]\]/g) || [];
        matches.forEach(match => {
            if (match.includes('%')) {
                if (match.includes('brszig')) {
                    console.log(`Fixing brszig: ${match.substring(0, 50)}...`);
                    xml = xml.replace(match, '[[brszig]]');
                    changed = true;
                }
                if (match.includes('kemeny')) {
                    console.log(`Fixing kemeny: ${match.substring(0, 50)}...`);
                    xml = xml.replace(match, '[[kemeny]]');
                    changed = true;
                }
            }
        });

        if (changed) {
            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Saved fixes to ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }

    } catch (e) {
        console.error(`Error fixing ${file}:`, e.message);
    }
} else {
    console.log(`${file} not found.`);
}
