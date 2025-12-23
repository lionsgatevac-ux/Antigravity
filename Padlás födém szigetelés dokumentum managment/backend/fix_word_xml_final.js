const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // Strategy: 
    // Find all <w:t> tags containing 'alairasugyfel'.
    // If they don't contain '%', they are the 'ghost' tags.
    // Replace the content 'alairasugyfel' with empty string.

    // Regex to match <w:t>...alairasugyfel...</w:t>
    // We capture the whole tag to inspect it.
    // Note: <w:t> might have attributes usually, but in match #2 it looks like <w:t>alairasugyfel</w:t>

    // Global replacement function
    let count = 0;
    xml = xml.replace(/<w:t([^>]*)>([^<]*)alairasugyfel([^<]*)<\/w:t>/g, (match, attrs, prefix, suffix) => {
        const fullContent = prefix + 'alairasugyfel' + suffix;

        // If it contains %, it's the valid image tag (Match #1)
        if (fullContent.includes('%')) {
            console.log('Keeping valid tag:', match);
            return match; // Keep it
        }

        // Otherwise, it's the broken text tag (Match #2)
        console.log('Removing ghost tag content in:', match);
        count++;
        // Return element with empty content or content minus the variable name
        return `<w:t${attrs}>${prefix}${suffix}</w:t>`;
    });

    console.log(`Removed ${count} ghost occurrences.`);

    zip.file('word/document.xml', xml);

    const buffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    fs.writeFileSync(templatePath, buffer);
    console.log('Template repaired successfully.');

} catch (e) {
    console.error('Fix failed:', e);
}
