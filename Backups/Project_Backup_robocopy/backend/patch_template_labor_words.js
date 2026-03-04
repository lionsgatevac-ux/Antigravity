const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    // Check if [[munkadij]] exists
    if (xml.includes('[[munkadij]]')) {
        console.log('Found [[munkadij]]. Adding [[munkadijbetuvel]] after it.');
        // Replace [[munkadij]] with [[munkadij]] (azaz [[munkadijbetuvel]])
        // We use a safe replacement to avoid double brackets if logic is weird
        // Note: We should be careful about formatting.
        xml = xml.replace(/\[\[munkadij\]\]/g, '[[munkadij]] (azaz [[munkadijbetuvel]])');

        zip.file('word/document.xml', xml);
        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log('Template updated successfully.');
    } else {
        console.log('[[munkadij]] NOT found. Searching for [[munkadíj]]...');
        if (xml.includes('[[munkadíj]]')) {
            xml = xml.replace(/\[\[munkadíj\]\]/g, '[[munkadíj]] (azaz [[munkadijbetuvel]])');
            zip.file('word/document.xml', xml);
            fs.writeFileSync(templatePath, zip.generate({ type: 'nodebuffer' }));
            console.log('Template updated (found with accent).');
        } else {
            console.log('Neither [[munkadij]] nor [[munkadíj]] found. Cannot auto-patch.');
            // Fallback: Check for [[szerzodesi_osszeg]] if user confused terms?
            console.log('Checking [[szerzodesi_osszeg]] just in case...');
            if (xml.includes('[[szerzodesi_osszeg]]')) {
                console.log('Found [[szerzodesi_osszeg]]. Maybe patch this? No, risky.');
            }
        }
    }

} catch (e) {
    console.error('Error:', e);
}
