const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const xml = zip.files['word/document.xml'].asText();

    console.log('--- Searching for "alairasugyfel" tags ---');

    let regex = /((?:[\s\S]{0,100}))(%?alairasugyfel)((?:[\s\S]{0,100}))/g;
    let match;
    let count = 0;

    while ((match = regex.exec(xml)) !== null) {
        count++;
        console.log(`\nOccurrence #${count}:`);
        console.log(`FULL TAG: [[${match[2]}]]`); // Assuming it's inside brackets usually, but regex here matches the var name
        console.log(`CONTEXT BEFORE: ...${match[1]}...`);
        console.log(`CONTEXT AFTER: ...${match[3]}...`);
    }

    if (count === 0) {
        console.log('No "alairasugyfel" found.');
    }

} catch (e) {
    console.error('Error:', e);
}
