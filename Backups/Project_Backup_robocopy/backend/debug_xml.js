const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    const searchTerm = 'alairasugyfel';
    const idx = xml.indexOf(searchTerm);

    let output = '';
    if (idx !== -1) {
        output += `FOUND "${searchTerm}" at index ${idx}\n`;
        const start = Math.max(0, idx - 200);
        const end = Math.min(xml.length, idx + 200);
        output += 'CONTEXT:\n';
        output += xml.substring(start, end);
    } else {
        output += `NOT FOUND: "${searchTerm}"`;
    }

    fs.writeFileSync(path.join(__dirname, 'xml_debug_output.txt'), output);
    console.log('Debug info written to xml_debug_output.txt');

} catch (e) {
    console.error(e);
}
