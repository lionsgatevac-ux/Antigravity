const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const templates = [
    {
        name: 'megallapodas_hem.docx', fixes: [
            { find: /\[\[%nev\]\]/g, replace: '[[nev]]' },
            { find: /\[\[%szuletesnev\]\]/g, replace: '[[szuletesnev]]' },
            // Fix split brszamoltertek. We use the exact raw string from the log.
            // [[brszamolt</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:highlight w:val="white"/></w:rPr><w:t>ertek</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:highlight w:val="white"/></w:rPr><w:t>]]
            // This is tricky to regex. Use exact string match/replace if possible?
            // JS replace supports strings.
            // We will try a flexible regex first.
            {
                find: /\[\[brszamolt(.*?)(?:ertek|érték)(.*?)\]\]/g,
                replace: '[[brszamoltertek]]'
            }
        ]
    },
    {
        name: 'tamogatas_igenylo.docx', fixes: [
            // Fix double %
            { find: /\[\[%%alairas\]\]/g, replace: '[[%alairas]]' },
            // Fix bad text tags (simplified, assuming we strip XML or use smart replace)
            // Since we are operating on raw XML, we need to match the XML tags in between if present.
            // The log showed: [[%</w:t>...<w:t>nev</w:t>...]]
            // We want to remove the % but keep the structure? No, simpler to just replace with clean [[nev]].
            // Docx can handle [[nev]] in one text node.
            { find: /\[\[%\s*(<[^>]+>\s*)*nev\s*(<[^>]+>\s*)*\]\]/g, replace: '[[nev]]' },
            { find: /\[\[%\s*(<[^>]+>\s*)*szuletesnev\s*(<[^>]+>\s*)*\]\]/g, replace: '[[szuletesnev]]' },

            // Very specific raw fix for the one in the log
            {
                find: /\[\[%<\/w:t><\/w:r><w:proofErr w:type="spellStart"\/><w:r w:rsidRPr="006D0F7B"><w:t>nev<\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/><w:r w:rsidRPr="006D0F7B"><w:t>\]\]/g,
                replace: '[[nev]]'
            },
            {
                find: /\[\[%<\/w:t><\/w:r><w:r><w:t>%<\/w:t><\/w:r><w:proofErr w:type="spellStart"\/><w:r><w:t>alairas<\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/><w:r w:rsidRPr="006D0F7B"><w:t>\]\]/g,
                replace: '[[%alairas]]'
            }
        ]
    }
];

// Re-check for tamogatas filename
const dir = path.join(__dirname, 'templates');
const files = fs.readdirSync(dir);
const tamogatasFile = files.find(f => f.includes('tamogatas') && f.includes('igenylo'));
if (tamogatasFile) {
    console.log(`Found actual tamogatas file: ${tamogatasFile}`);
    templates.find(t => t.name === 'tamogatas_igenylo.docx').name = tamogatasFile;
}

templates.forEach(t => {
    const filePath = path.join(__dirname, 'templates', t.name);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${t.name} (not found)`);
        return;
    }

    console.log(`Processing ${t.name}...`);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        let xml = zip.file('word/document.xml').asText();
        let changed = false;

        t.fixes.forEach(fix => {
            // Check if exists
            if (xml.match(fix.find)) {
                console.log(`Applying fix: ${fix.find} -> ${fix.replace}`);
                xml = xml.replace(fix.find, fix.replace);
                changed = true;
            } else {
                // Try to match the complex string from log directly
                if (t.name === 'megallapodas_hem.docx' && fix.replace === '[[brszamoltertek]]') {
                    // The log output might have truncated or modified.
                    // Let's try to match "[[brszamolt" and "ertek...]]"
                    const splitMatch = /\[\[brszamolt[\s\S]*?ertek[\s\S]*?\]\]/g;
                    if (xml.match(splitMatch)) {
                        console.log("Found split brszamoltertek, fixing...");
                        xml = xml.replace(splitMatch, '[[brszamoltertek]]');
                        changed = true;
                    }
                }
            }
        });

        if (changed) {
            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Saved fixes to ${t.name}`);
        } else {
            console.log(`No changes needed for ${t.name}`);
        }

    } catch (e) {
        console.error(`Error fixing ${t.name}:`, e.message);
    }
});
