const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const files = [
    '2026kivitelezesi_szerzodes.docx',
    '2026 atadas_atveteli.docx',
    'kivitelezoi_nyilatkozat_OLD.docx'
];

const templatesDir = path.join(__dirname, 'templates');

files.forEach(file => {
    const filePath = path.join(templatesDir, file);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'binary');
            const zip = new PizZip(content);
            const docXml = zip.files['word/document.xml'].asText();
            // Simple check for key phrases
            const isContract = docXml.includes('VÁLLALKOZÁSI SZERZŐDÉS') || docXml.includes('KIVITELEZÉSI SZERZŐDÉS');
            const isHandover = docXml.includes('ÁTADÁS-ÁTVÉTELI') || docXml.includes('Átadás-átvételi');
            const isDeclaration = docXml.includes('KIVITELEZŐI NYILATKOZAT') || docXml.includes('Nyilatkozat');

            console.log(`[FILE] ${file}`);
            console.log(`   - Is Contract? ${isContract}`);
            console.log(`   - Is Handover? ${isHandover}`);
            console.log(`   - Is Declaration? ${isDeclaration}`);
            console.log(`   - Snippet: ${docXml.substring(0, 500).replace(/<[^>]+>/g, '')}`);
            console.log('---------------------------------------------------');
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    } else {
        console.log(`[MISSING] ${file}`);
    }
});
