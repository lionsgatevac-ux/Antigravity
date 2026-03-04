const fs = require('fs');
const PizZip = require('pizzip');

try {
    const content = fs.readFileSync('../templates/kivitelezesi_szerzodes.docx');
    const zip = new PizZip(content);
    const text = zip.files['word/document.xml'].asText();

    const index = text.indexOf('Végfelhasználó');
    if (index !== -1) {
        // Look 2000 chars back
        const start = Math.max(0, index - 2000);
        const end = index + 500;
        const context = text.substring(start, end);
        fs.writeFileSync('debug_dots_wide.txt', context);
        console.log('Saved wide context.');
    } else {
        console.log('Végfelhasználó not found.');
    }

} catch (e) {
    console.error(e);
}
