const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    // We look for [[]] possibly separated by tags
    // Regex: \[\[ (<[^>]*>)* \]\]
    const regex = /\[\[(?:<[^>]*>)*\]\]/g;

    let changed = false;
    if (regex.test(xml)) {
        console.log('Found empty brackets [[]]! Removing them...');
        xml = xml.replace(regex, '');
        changed = true;
    }

    // Also look for literal [[]] just in case
    if (xml.includes('[[]]')) {
        console.log('Found literal [[]]. Removing...');
        xml = xml.replace(/\[\[\]\]/g, '');
        changed = true;
    }

    if (changed) {
        zip.file('word/document.xml', xml);
        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log('Template cleaned of empty brackets.');
    } else {
        console.log('No empty brackets found via regex.');
    }

} catch (e) {
    console.error('Error:', e);
}
