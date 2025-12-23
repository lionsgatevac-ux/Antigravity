const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();
    const text = xml.replace(/<[^>]+>/g, '');

    // Find "Munkadíj" using loose matching (case insensitive)
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf('munkadíj');

    if (index !== -1) {
        console.log('--- FOUND Munkadíj ---');
        console.log(text.substring(index, index + 200));
        console.log('----------------------');
    } else {
        console.log('Could not find "Munkadíj" in text.');
    }

} catch (e) {
    console.error('Error:', e);
}
