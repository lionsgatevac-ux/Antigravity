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

        console.log(`\n=== FILE: ${file} ===`);

        // Find table rows containing material keywords
        const terms = ['párazáró', 'szigetelés', 'páraáteresztő'];

        terms.forEach(term => {
            const index = text.toLowerCase().indexOf(term.toLowerCase());
            if (index !== -1) {
                // Find nearest <w:tr> ... </w:tr>
                const startTr = text.lastIndexOf('<w:tr ', index);
                const endTr = text.indexOf('</w:tr>', index);

                if (startTr !== -1 && endTr !== -1) {
                    const rowXml = text.substring(startTr, endTr + 7);
                    console.log(`[ROW for ${term}]:`, rowXml);
                } else {
                    console.log(`[CONTEXT for ${term}]:`, text.substring(index - 50, index + 200));
                }
            }
        });

        // Search for alaprajz
        const aIndex = text.indexOf('alaprajz');
        if (aIndex !== -1) {
            const startTr = text.lastIndexOf('<w:tr ', aIndex);
            const endTr = text.indexOf('</w:tr>', aIndex);
            if (startTr !== -1 && endTr !== -1) {
                console.log(`[ROW for alaprajz]:`, text.substring(startTr, endTr + 7));
            } else {
                console.log(`[CONTEXT for alaprajz]:`, text.substring(aIndex - 50, aIndex + 200));
            }
        } else {
            console.log(`[NOT FOUND]: alaprajz`);
        }

    } catch (e) {
        console.error(`Error:`, e.message);
    }
});
