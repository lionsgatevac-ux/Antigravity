const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'templates');
const files = ['kivitelezesi_szerzodes.docx', 'atadas_atveteli.docx', 'kivitelezoi_nyilatkozat.docx', 'megallapodas_hem.docx'];

function cleanXmlTags(str) {
    return str.replace(/<[^>]+>/g, '');
}

function repairFracturedTags(xml) {
    // Standard repair for [[ ... ]] spanning multiple <w:t>
    const diffRegex = /\[\[((?:(?!\]\]).)+?)\]\]/g;
    return xml.replace(diffRegex, (match, inner) => {
        const cleaned = cleanXmlTags(inner).trim();
        if (cleaned !== inner && cleaned.length < 50 && !inner.includes('w:p') && !inner.includes('w:tr')) {
            console.log(`  Repaired: ${match} -> [[${cleaned}]]`);
            return `[[${cleaned}]]`;
        }
        return match;
    });
}

function ensureMaterialTags(xml, file) {
    let newXml = xml;
    const mappings = [
        { label: 'Párazáró fólia típusa:', tag: '[[parazarofolia]]' },
        { label: 'Üveggyapot típusa:', tag: '[[szigeteles]]' },
        { label: 'Pára áteresztő fólia:', tag: '[[paraateresztofolia]]' },
        { label: 'Páraáteresztő fólia:', tag: '[[paraateresztofolia]]' }
    ];

    mappings.forEach(m => {
        if (!newXml.includes(m.tag)) {
            const index = newXml.indexOf(m.label);
            if (index !== -1) {
                // Find the next cell <w:tc>
                const nextTc = newXml.indexOf('<w:tc>', index);
                if (nextTc !== -1) {
                    const nextT = newXml.indexOf('<w:t>', nextTc);
                    const nextCloseT = newXml.indexOf('</w:t>', nextT);
                    if (nextT !== -1 && nextCloseT !== -1) {
                        const content = newXml.substring(nextT + 5, nextCloseT);
                        if (cleanXmlTags(content).trim() === '') {
                            console.log(`  Inserting ${m.tag} into ${file} for ${m.label}`);
                            newXml = newXml.substring(0, nextT + 5) + m.tag + newXml.substring(nextCloseT);
                        }
                    }
                }
            }
        }
    });
    return newXml;
}

function ensureAlaprajz(xml, file) {
    if (xml.includes('alaprajz')) return xml;

    console.log(`  Adding [[alaprajz]] to ${file}`);
    // Look for a good place, e.g. before "Melléklet" or before signatures
    // In these templates, often there is a section about technical details.
    // Let's try to find "Kelt:" or signatures area
    let index = xml.indexOf('Aláírás');
    if (index === -1) index = xml.indexOf('Dátum:');
    if (index === -1) index = xml.lastIndexOf('</w:body>');

    // Insert before signatures in a new paragraph
    const pXml = `<w:p><w:r><w:t>Alaprajz:</w:t></w:r></w:p><w:p><w:r><w:t>[[alaprajz]]</w:t></w:r></w:p>`;
    return xml.substring(0, index) + pXml + xml.substring(index);
}

files.forEach(file => {
    const filePath = path.join(templatesDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        return;
    }

    console.log(`Processing ${file}...`);
    try {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);
        let xml = zip.files['word/document.xml'].asText();

        let repairedXml = repairFracturedTags(xml);
        repairedXml = ensureMaterialTags(repairedXml, file);
        repairedXml = ensureAlaprajz(repairedXml, file);

        if (repairedXml !== xml) {
            zip.file('word/document.xml', repairedXml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
            console.log(`  SUCCESS: Saved changes to ${file}`);
        } else {
            console.log(`  NO CHANGES needed for ${file}`);
        }
    } catch (e) {
        console.error(`  ERROR processing ${file}:`, e.message);
    }
});
