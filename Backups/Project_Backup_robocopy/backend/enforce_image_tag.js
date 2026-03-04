const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // 1. Simple replacement: [[alairasugyfel]] -> [[%alairasugyfel]]
    // This fixes the case where it was explicitly a text tag
    let count = 0;
    xml = xml.replace(/\[\[alairasugyfel\]\]/g, (match) => {
        console.log('Fixing text tag to image tag:', match);
        count++;
        return '[[%alairasugyfel]]';
    });

    // 2. Also look for potential "broken" tags where formatting might have split it
    // e.g. <w:t>[[</w:t> ... <w:t>alairasugyfel</w:t> ... <w:t>]]</w:t>
    // This is harder to regex safely without destroying structure. 
    // But often the simple logic works if we just ensure the variable name in the data has % if the template expects it? 
    // No, variable names in data shouldn't have %. The % is a trigger in the template.

    console.log(`Fixed ${count} tags.`);

    if (count === 0) {
        console.log('No direct [[alairasugyfel]] tags found. Checking for partials...');
        if (xml.includes('alairasugyfel') && !xml.includes('%alairasugyfel')) {
            console.log('WARNING: "alairasugyfel" exists but not as an image tag!');
        }
    }

    zip.file('word/document.xml', xml);

    const buffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    fs.writeFileSync(templatePath, buffer);
    console.log('Template updated.');

} catch (e) {
    console.error('Error:', e);
}
