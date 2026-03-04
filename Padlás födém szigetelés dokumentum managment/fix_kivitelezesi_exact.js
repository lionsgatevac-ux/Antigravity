const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const file = 'kivitelezesi_szerzodes.docx';
const filePath = path.join(__dirname, 'templates', file);

// Exact strings grabbed from the log file
const targets = [
    {
        // [[%...brszig...]]
        findString: '[[%</w:t></w:r><w:proofErr w:type="spellStart"/><w:r w:rsidRPr="0078450F"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>brszig</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r w:rsidRPr="0078450F"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>]]',
        replace: '[[brszig]]'
    },
    {
        // [[%...kemeny...]]
        findString: '[[%</w:t></w:r><w:proofErr w:type="spellStart"/><w:r w:rsidRPr="0078450F"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>kemeny</w:t></w:r><w:proofErr w:type="spellEnd"/><w:r w:rsidRPr="0078450F"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>]]',
        replace: '[[kemeny]]'
    }
];

if (fs.existsSync(filePath)) {
    console.log(`Processing ${file}...`);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        let xml = zip.file('word/document.xml').asText();
        let changed = false;

        targets.forEach(t => {
            if (xml.indexOf(t.findString) !== -1) {
                console.log(`Found exact match for ${t.replace}. Replacing...`);
                // Split and join is safer than replace for large literal strings with special regex chars
                xml = xml.split(t.findString).join(t.replace);
                changed = true;
            } else {
                console.log(`❌ Exact match NOT found for ${t.replace}. XML might differ slightly.`);
            }
        });

        if (changed) {
            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Saved fixes to ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }

    } catch (e) {
        console.error(`Error fixing ${file}:`, e.message);
    }
} else {
    console.log(`${file} not found.`);
}
