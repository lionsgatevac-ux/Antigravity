const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // Strategy: Remove ALL variations of 'alairasugyfel'
    // 1. Exact tags: [[%alairasugyfel]]
    // 2. Text tags: [[alairasugyfel]]
    // 3. Fragmented tags containing 'alairasugyfel'

    // We will use the same robust regex approach but this time to DELETE everything.

    // Regex to find <w:t>...alairasugyfel...</w:t> and replace with empty string
    let count = 0;
    xml = xml.replace(/<w:t([^>]*)>([^<]*)alairasugyfel([^<]*)<\/w:t>/g, (match) => {
        console.log('Removing tag:', match);
        count++;
        return ''; // Delete it
    });

    console.log(`Removed ${count} occurrences.`);

    zip.file('word/document.xml', xml);

    const buffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    fs.writeFileSync(templatePath, buffer);
    console.log('Template cleaned successfully - NO SIGNATURES LEFT.');

} catch (e) {
    console.error('Resize failed:', e);
}
