const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    // Check if [[szerzodesi_osszeg]] exists
    if (xml.includes('[[szerzodesi_osszeg]]')) {
        console.log('Found [[szerzodesi_osszeg]]. Adding text version after it.');

        // Check if verify if it already has it?
        if (xml.includes('[[szerzodesi_osszeg_betuvel]]')) {
            console.log('Template ALREADY has [[szerzodesi_osszeg_betuvel]]. checking if it is empty logic?');
        } else {
            xml = xml.replace(/\[\[szerzodesi_osszeg\]\]/g, '[[szerzodesi_osszeg]] (azaz [[szerzodesi_osszeg_betuvel]])');

            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(templatePath, buffer);
            console.log('Template updated: added (azaz [[szerzodesi_osszeg_betuvel]]).');
        }
    } else {
        console.log('[[szerzodesi_osszeg]] also not found.');
    }

} catch (e) {
    console.error('Error:', e);
}
