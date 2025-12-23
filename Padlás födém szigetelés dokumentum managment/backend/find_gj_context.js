const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    // Find text around GJ
    const cleanXml = xml.replace(/<[^>]+>/g, ' '); // Replace tags with space to keep words separated
    const index = cleanXml.indexOf('GJ');
    if (index !== -1) {
        console.log('Context around GJ:');
        console.log(cleanXml.substring(index - 50, index + 50));
    } else {
        console.log('GJ not found in clean text.');
    }

    // Let's also search for [[gj]] rawly in XML to see if it's there but broken
    if (xml.includes('gj')) {
        console.log('Found "gj" in raw XML.');
        // Find where it is
        const rawIndex = xml.indexOf('gj');
        console.log('Context in XML:', xml.substring(rawIndex - 20, rawIndex + 20));
    }

} catch (e) {
    console.error('Error:', e.message);
}
