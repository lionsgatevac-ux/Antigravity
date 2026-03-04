const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    fs.writeFileSync(path.join(__dirname, 'hem_full.xml'), xml);
    console.log('Dumped hem_full.xml');

    // Count occurrences
    const count = (xml.match(/alairasugyfel/g) || []).length;
    console.log(`Total "alairasugyfel" occurrences: ${count}`);

    // Check for non-prefixed
    // We look for "alairasugyfel" NOT preceded by % in the string.
    // Since JS lookbehind is limited in some envs, we'll iterate.
    let badCount = 0;
    let pos = xml.indexOf('alairasugyfel');
    while (pos !== -1) {
        if (xml[pos - 1] !== '%') {
            console.log(`POTENTIAL BAD TAG at index ${pos}: ...${xml.substring(pos - 10, pos + 15)}...`);
            badCount++;
        }
        pos = xml.indexOf('alairasugyfel', pos + 1);
    }
    console.log(`Bad tags found: ${badCount}`);

} catch (e) {
    console.error(e);
}
