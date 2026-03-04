const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates\\atadas_atveteli.docx';

function cleanXmlTags(str) {
    return str.replace(/<[^>]+>/g, '');
}

console.log(`--- FINAL REPAIR: ${templatePath} ---`);

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    let xml = zip.files['word/document.xml'].asText();

    let repairs = 0;
    let searchIndex = 0;

    while (true) {
        const startBracket = xml.indexOf('[[', searchIndex);
        if (startBracket === -1) break;

        const endBracket = xml.indexOf(']]', startBracket);
        if (endBracket === -1) {
            searchIndex = startBracket + 2;
            continue;
        }

        const match = xml.substring(startBracket, endBracket + 2);
        const inner = match.substring(2, match.length - 2);
        const cleaned = cleanXmlTags(inner).trim();

        // Check for ACTUAL structural breaks. 
        // We use more precise matching to avoid false positives like <w:proofErr matching <w:p
        const hasStructural =
            inner.includes('<w:p ') || inner.includes('<w:p>') || inner.includes('</w:p>') ||
            inner.includes('<w:tc ') || inner.includes('<w:tc>') || inner.includes('</w:tc>') ||
            inner.includes('<w:tr ') || inner.includes('<w:tr>') || inner.includes('</w:tr>');

        if (hasStructural) {
            console.log(`  - Skipping potentially multi-paragraph/multi-cell tag: [[${cleaned}]]`);
            searchIndex = endBracket + 2;
            continue;
        }

        if (cleaned !== inner && cleaned.length > 0 && cleaned.length < 50) {
            console.log(`  - Fixing fractured tag: [[${cleaned}]]`);
            repairs++;

            const before = xml.substring(0, startBracket);
            const after = xml.substring(endBracket + 2);
            xml = before + `[[${cleaned}]]` + after;

            searchIndex = startBracket + cleaned.length + 4;
        } else {
            searchIndex = endBracket + 2;
        }
    }

    if (repairs > 0) {
        zip.file('word/document.xml', xml);
        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log(`\n✅ Success! Repaired ${repairs} fractured tags in atadas_atveteli.docx.`);
    } else {
        console.log('\nℹ️ No fractured tags found that needed repair.');
    }

} catch (error) {
    console.error('Repair failed:', error);
}
