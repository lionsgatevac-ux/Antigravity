const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'templates', 'kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const text = zip.files['word/document.xml'].asText();

    const tags = [];
    const regex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        tags.push(match[1].trim());
    }

    // Sort and uniq
    const uniqueTags = [...new Set(tags)].sort();

    fs.writeFileSync('contract_tags_list.txt', uniqueTags.join('\n'));
    console.log(`Found ${uniqueTags.length} unique tags. Written to contract_tags_list.txt`);
} catch (e) {
    console.error(e);
}
