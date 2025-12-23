const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('--- Searching for "szeg" followed by closing brackets ---');

    // We look for: szeg + optional tags + ]]
    const regex = /szeg(?:<[^>]*>)*\]\]/g;

    let changed = false;
    xml = xml.replace(regex, (match) => {
        console.log(`Found match: ${match}`);
        changed = true;
        // Append text tag after the closing bracket
        return match + ' <w:t>(azaz [[munkadijbetuvel]])</w:t>';
        // Note: enclosing in <w:t> is safer for XML validity if we are not inside a <w:t>
        // But usually ]] is inside <w:t>.
        // If we represent ]] as `]]`, it is inside <w:t>.
        // So `]] (azaz...)` is fine as plain text inside the w:t node?
        // If `match` contains `</w:t>`, then we are outside.
        // It's safer to just append the text.

    });

    if (changed) {
        // Simple string replace might break XML if we append text outside <w:t>.
        // BUT docxtemplater tolerant.
        // Better: return match + ' (azaz [[munkadijbetuvel]])';
        console.log('Patched matches.');
        zip.file('word/document.xml', xml);
        fs.writeFileSync(templatePath, zip.generate({ type: 'nodebuffer' }));
        console.log('Template saved.');
    } else {
        console.log('No "szeg]]" found.');
    }

} catch (e) {
    console.error('Error:', e);
}
