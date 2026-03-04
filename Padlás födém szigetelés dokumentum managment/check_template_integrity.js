const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, 'templates');
const templateFiles = [
    'megallapodas_hem.docx',
    'kivitelezoi_nyilatkozat.docx',
    'kivitelezesi_szerzodes.docx',
    'tamogatas_igenylo.docx',
    '2026 atadas_atveteli.docx',
    'kivitelezoi_nyilatkozat_OLD.docx'
];

const referenceFile = path.join(__dirname, 'HELYES_FAJL_SZERVERROL.docx');

function checkFile(filePath) {
    const name = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ [${name}] MISSING`);
        return;
    }

    const stats = fs.statSync(filePath);
    console.log(`\n📄 [${name}]`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);

    if (stats.size === 0) {
        console.log(`   ❌ CORRUPTED: Size is 0`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        // Try to read document.xml to verify it's a valid docx
        const xml = zip.file('word/document.xml');
        if (xml) {
            console.log(`   ✅ VALID DOCX (Internal document.xml found)`);
            const text = xml.asText();
            console.log(`   Length of document.xml: ${text.length} chars`);
        } else {
            console.log(`   ⚠️ WARNING: Valid ZIP but 'word/document.xml' not found`);
        }
    } catch (e) {
        console.log(`   ❌ INVALID ZIP: ${e.message}`);
    }
}

console.log("--- Checking Templates Directory ---");
templateFiles.forEach(f => checkFile(path.join(templatesDir, f)));

console.log("\n--- Checking Reference File ---");
checkFile(referenceFile);
