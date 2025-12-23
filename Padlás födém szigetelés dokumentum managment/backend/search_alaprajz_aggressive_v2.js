const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'templates', 'kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const text = zip.files['word/document.xml'].asText();

    // Search for "alaprajz" in any form
    const index = text.indexOf('alaprajz');
    if (index !== -1) {
        console.log('Found "alaprajz" at index:', index);
        console.log('Context:', text.substring(index - 20, index + 30));
    } else {
        console.log('"alaprajz" not found in XML.');
    }

    // Also look for fractured variants like [[ ala...prajz ]]
    const fracturedMatch = text.match(/\[\[.*a.*l.*a.*p.*r.*a.*j.*z.*\]\]/);
    if (fracturedMatch) {
        console.log('Found FRACTURED alaprajz tag:', fracturedMatch[0]);
    }
} catch (e) {
    console.error(e);
}
