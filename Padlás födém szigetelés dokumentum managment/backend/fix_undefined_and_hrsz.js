const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // 1. Search for "undefined" in all XML files
    for (const fileName in zip.files) {
        if (fileName.endsWith('.xml')) {
            let xml = zip.files[fileName].asText();
            if (xml.includes('undefined')) {
                console.log(`FOUND "undefined" in ${fileName}! Removing it...`);
                // Replace globally
                xml = xml.replace(/undefined/g, '');
                zip.file(fileName, xml);
                console.log(`Removed "undefined" from ${fileName}.`);
            }
        }
    }

    // 2. Fix HRSZ in document.xml
    let docXml = zip.files['word/document.xml'].asText();

    // Look for "hrsz.-ú"
    // And ensure it is preceded by [[hrsz]]
    // Regex: look for hrsz.-ú NOT preceded by [[hrsz]] (roughly)

    // Safer: Replace "hrsz.-ú" with "[[hrsz]] hrsz.-ú"
    // But check if it already exists.

    // Let's look for the specific context from the screenshot "cím alatti,"
    // "cím alatti" ... "hrsz.-ú"

    const contextRegex = /(cím alatti(?:<[^>]*>|[\s,])*?)(hrsz\.-ú)/g;

    if (contextRegex.test(docXml)) {
        console.log('Found "cím alatti ... hrsz.-ú" pattern.');
        docXml = docXml.replace(contextRegex, '$1 [[hrsz]] $2');
        console.log('Inserted [[hrsz]] into the sequence.');
    } else {
        console.log('Could not match specific "cím alatti" context. Trying generic patch...');
        // Generic patch: find "hrsz.-ú" and check immediately before
        // This is risky if regex is too simple for XML.
        // Let's just SEARCH for [[hrsz]] nearby.
        const idx = docXml.indexOf('hrsz.-ú');
        if (idx !== -1) {
            const before = docXml.substring(Math.max(0, idx - 100), idx);
            if (!before.includes('[[hrsz]]')) {
                console.log('[[hrsz]] not found nearby. Prepending it...');
                docXml = docXml.replace('hrsz.-ú', ' [[hrsz]] hrsz.-ú');
            } else {
                console.log('[[hrsz]] seems to present nearby. Not touching.');
            }
        }
    }

    zip.file('word/document.xml', docXml);

    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, buffer);
    console.log('Template patched (Undefined check + HRSZ fix).');

} catch (e) {
    console.error('Error:', e);
}
