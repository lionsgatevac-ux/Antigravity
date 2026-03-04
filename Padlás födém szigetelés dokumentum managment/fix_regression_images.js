const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const templates = [
    {
        name: '2026 atadas_atveteli.docx',
        fixes: [
            // Standard incorrect tags
            { find: /\[\[%cim\]\]/g, replace: '[[cim]]' },
            { find: /\[\[%hrsz\]\]/g, replace: '[[hrsz]]' },
            // Split tags (aggressive regex to catch [[%...text...]])
            { find: /\[\[%\s*(<[^>]+>\s*)*cim\s*(<[^>]+>\s*)*\]\]/g, replace: '[[cim]]' },
            { find: /\[\[%\s*(<[^>]+>\s*)*hrsz\s*(<[^>]+>\s*)*\]\]/g, replace: '[[hrsz]]' }
        ]
    },
    {
        name: 'kivitelezesi_szerzodes.docx',
        fixes: [
            // Revert mistakenly percent-prefixed text tags
            { find: /\[\[%\s*(<[^>]+>\s*)*nev\s*(<[^>]+>\s*)*\]\]/g, replace: '[[nev]]' },
            { find: /\[\[%\s*(<[^>]+>\s*)*cim\s*(<[^>]+>\s*)*\]\]/g, replace: '[[cim]]' },
            { find: /\[\[%\s*(<[^>]+>\s*)*ev\s*(<[^>]+>\s*)*\]\]/g, replace: '[[ev]]' }, // 'ev' (year)
            { find: /\[\[%\s*(<[^>]+>\s*)*brszig\s*(<[^>]+>\s*)*\]\]/g, replace: '[[brszig]]' },
            { find: /\[\[%\s*(<[^>]+>\s*)*kemeny\s*(<[^>]+>\s*)*\]\]/g, replace: '[[kemeny]]' },

            // Explicit simple replacements if regex misses
            { find: /\[\[%nev\]\]/g, replace: '[[nev]]' },
            { find: /\[\[%cim\]\]/g, replace: '[[cim]]' },
            { find: /\[\[%ev\]\]/g, replace: '[[ev]]' },
            { find: /\[\[%brszig\]\]/g, replace: '[[brszig]]' },
            { find: /\[\[%kemeny\]\]/g, replace: '[[kemeny]]' }
        ]
    }
];

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
            if (xml.match(fix.find)) {
                console.log(`Applying fix for ${fix.find}`);
                xml = xml.replace(fix.find, fix.replace);
                changed = true;
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
