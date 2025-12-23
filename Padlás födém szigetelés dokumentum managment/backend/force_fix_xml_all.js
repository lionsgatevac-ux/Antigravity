const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Target files - ALL of them to be safe
const files = [
    'megallapodas_hem.docx',
    'atadas_atveteli.docx',
    'kivitelezesi_szerzodes.docx'
];

// Tags to ensure have % prefix
const tagsToCheck = ['alairasugyfel', 'alairaskivitelezo', 'alaprajz'];

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

        // AGGRESSIVE REPAIR V2:
        // Identify any occurrence of the tag name that does NOT have % immediately before it.
        // We iterate specifically to handle cases like "[[ alairas... ]]" vs "[[alairas...]]"
        // Actually, in the XML text (value), we usually just see "alairasugyfel".
        // The [ ] might be in separate runs.
        // So we strictly ensure that the string "alairasugyfel" is replaced by "%alairasugyfel"
        // UNLESS it is already "%alairasugyfel".

        tagsToCheck.forEach(tagName => {
            // We loop until we find no more un-prefixed occurrences
            let pos = xml.indexOf(tagName);
            while (pos !== -1) {
                // Check char before
                const charBefore = pos > 0 ? xml[pos - 1] : '';

                if (charBefore !== '%') {
                    console.log(`Found un-prefixed "${tagName}" at ${pos}. Patching...`);
                    // Splice in the %
                    xml = xml.slice(0, pos) + '%' + xml.slice(pos);
                    modified = true;
                    // Adjust pos because we inserted a char
                    pos = xml.indexOf(tagName, pos + 1 + tagName.length);
                } else {
                    // It is already prefixed
                    // console.log(`Found correctly prefixed "%${tagName}" at ${pos-1}.`);
                    pos = xml.indexOf(tagName, pos + 1);
                }
            }
        });

        if (modified) {
            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(templatePath, buffer);
            console.log(`Saved patched file: ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }

    } catch (e) {
        console.error(e);
    }
});
