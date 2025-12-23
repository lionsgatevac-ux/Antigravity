const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // We want to remove the FIRST occurrence of [[%alairasugyfel]] or [[alairasugyfel]]
    // Docxtemplater tags usually look like: <w:t>[[</w:t> ... <w:t>%alairasugyfel</w:t> ... <w:t>]]</w:t>
    // But since we fixed usage, checking for just "%alairasugyfel" or "alairasugyfel" is risky if we don't catch the brackets.
    // However, if we just remove the variable name, the brackets [[ ]] will remain empty [[]] making it disappear or print empty.

    // Better strategy: Find the first occurrence and replace it.

    let occurrences = 0;

    // Regex to find the variable name, possibly with % prefix
    const regex = /%?alairasugyfel/;

    // This replace only replaces the first occurrence by default in JS if not using global flag /g
    // But verify: string.replace(regex, ...) replaces the first match.

    let contextBefore = "";

    const newXml = xml.replace(regex, (match, offset) => {
        occurrences++;
        console.log(`Found match #${occurrences}: ${match} at offset ${offset}`);

        // Check context to be sure we are removing the top one
        // The screenshot shows it's near "E-mail cím" or "mint Ügyfél"
        const start = Math.max(0, offset - 200);
        const end = Math.min(xml.length, offset + 200);
        const context = xml.substring(start, end);
        console.log(`Context: ${context}`);

        if (occurrences === 1) {
            console.log('REMOVING this first occurrence.');
            return ''; // Replace with empty string
        }
        return match; // Should not happen with single replace, but logic holds
    });

    if (newXml === xml) {
        console.log('No replacement made! Tag not found?');
    } else {
        zip.file('word/document.xml', newXml);
        const buffer = zip.generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
        });
        fs.writeFileSync(templatePath, buffer);
        console.log('Template updated. First signature tag removed.');
    }

} catch (e) {
    console.error('Error:', e);
}
