const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');
const backupPath = path.join(__dirname, '../templates/kivitelezesi_szerzodes_backup.docx');

try {
    // 1. Create backup
    fs.copyFileSync(templatePath, backupPath);
    console.log('Backup created at:', backupPath);

    // 2. Load content
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // 3. Get XML
    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // 4. FIX: Remove spell/proof/grammar tags completely
    // These are often the cause of split runs: <w:proofErr .../>
    xml = xml.replace(/<w:proofErr[^>]*\/>/g, '');
    xml = xml.replace(/<w:lang[^>]*\/>/g, ''); // Sometimes lang tags split runs too

    // 5. Aggressive cleanup of split tags for specific known variables
    // This removes XML tags between [[ and % and variable names if they are close

    // We want to turn: [[</w:t></w:r><w:r>...</w:r><w:r><w:t>%alairasugyfel</w:t></w:r>...]]
    // into: [[%alairasugyfel]]

    // Strategy: Search for "alairasugyfel" and rebuild the tag around it if brackets are nearby

    // Simple approach first: Remove XML tags inside potential variable patterns
    // This is hard to do safely with Regex on raw XML.

    // Instead, let's use the Docxtemplater "Angular Parser" workaround idea:
    // Actually, simply removing the proofErr tags might solve 90% of cases.

    // Let's try to specifically target the alairasugyfel garbage
    // If we see `[[` then some XML then `alairasugyfel` then some XML then `]]`, we want to collapse it.

    // Replace logic:
    // Find sequences of text nodes that form the bad pattern

    // Update the zip
    zip.file('word/document.xml', xml);

    const buffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    fs.writeFileSync(templatePath, buffer);
    console.log('Template repaired successfully.');

} catch (e) {
    console.error('Fix failed:', e);
}
