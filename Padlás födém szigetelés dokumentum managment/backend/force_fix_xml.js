const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Target files
const files = ['atadas_atveteli.docx', 'megallapodas_hem.docx'];

files.forEach(file => {
    const templatePath = path.join(__dirname, '../templates', file);
    try {
        console.log(`\nProcessing: ${file}`);
        if (!fs.existsSync(templatePath)) {
            console.log('File not found');
            return;
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        let xml = zip.files['word/document.xml'].asText();

        let modified = false;

        // Strategy: find "alairasugyfel" and "alairaskivitelezo" in the XML.
        // If it's effectively a text tag (no %), verify the context and inject %.
        // We will be aggressive: replace the literal string "alairasX" with "%alairasX"
        // IF it is not already preceded by %.

        // This regex finds "alairas..." that is NOT preceded by %.
        // We use a negative lookbehind (?<!%) but JS support varies, so we capture the character before.
        // Actually, let's just replace all "[[alairas" with "[[%alairas".
        // BUT if the brackets are split, we might just see "alairas".

        // Let's print the context first to be sure.
        const matches = xml.match(/alairas(ugyfel|kivitelezo)/g);
        console.log('Matches found:', matches ? matches.length : 0);

        // AGGRESSIVE REPAIR:
        // Search for the sequence of characters that makes up the tag NAME, and ensure it has % prefix in the XML text.
        // Assuming the tag name is contiguous in at least one <w:t>.

        ['alairasugyfel', 'alairaskivitelezo'].forEach(tag => {
            if (xml.indexOf(tag) !== -1) {
                // Check if % matches
                if (xml.indexOf(`%${tag}`) === -1) {
                    console.log(`Found "${tag}" without %. Patching...`);
                    // Replace the first occurrence of "tag" with "%tag"
                    // This is risky if "tag" appears in other contexts (e.g. text description), 
                    // but "alairasugyfel" is a variable name, unlikely to be user text.
                    xml = xml.replace(new RegExp(tag, 'g'), `%${tag}`);
                    modified = true;
                } else {
                    console.log(`"${tag}" seems to have % already.`);
                }
            }
        });

        if (modified) {
            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(templatePath, buffer);
            console.log('Saved patched file.');
        } else {
            console.log('No changes needed.');
        }

    } catch (e) {
        console.error(e);
    }
});
