const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'templates');
const files = ['kivitelezesi_szerzodes.docx', 'atadas_atveteli.docx', 'kivitelezoi_nyilatkozat.docx', 'megallapodas_hem.docx'];

files.forEach(file => {
    const filePath = path.join(templatesDir, file);
    if (!fs.existsSync(filePath)) return;

    try {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);
        const text = zip.files['word/document.xml'].asText();

        console.log(`--- ${file} ---`);
        const xml = text.toLowerCase();

        // Search for relevant terms
        const searchTerms = ['párazáró', 'szigetelés', 'páraáteresztő', 'fólia'];
        let found = false;

        searchTerms.forEach(term => {
            const index = xml.indexOf(term.toLowerCase());
            if (index !== -1 && !found) {
                console.log(`Found "${term}" context:`);
                console.log(text.substring(index - 100, index + 500));
                found = true;
            }
        });

        if (!found) {
            console.log('No material keywords found.');
        }

        if (text.includes('alaprajz')) {
            console.log('✅ alaprajz tag exists.');
        } else {
            console.log('❌ alaprajz tag MISSING.');
        }
    } catch (e) {
        console.error(`Error processing ${file}:`, e.message);
    }
});
