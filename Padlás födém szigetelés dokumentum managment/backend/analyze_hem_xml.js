const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');

try {
    if (!fs.existsSync(templatePath)) {
        console.error("FATAL");
        process.exit(1);
    }
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    // Search for ALL docxtemplater tags
    const regex = /\[\[/g;
    let match;
    const indices = [];
    while ((match = regex.exec(xml)) !== null) {
        indices.push(match.index);
    }

    console.log(`Found ${indices.length} start tags.`);

    const logStr = indices.map(idx => {
        // Find closing ]]
        const closeIdx = xml.indexOf(']]', idx);
        if (closeIdx === -1) return `[Tag at ${idx}]: UNCLOSED`;

        const rawContent = xml.substring(idx, closeIdx + 2);
        // Strip tags for readability (simple regex)
        const textContent = rawContent.replace(/<[^>]+>/g, '').replace(/\[\[/g, '').replace(/\]\]/g, '').trim();
        return `[Tag at ${idx}]: "${textContent}" (Raw len: ${rawContent.length})`;
    }).join('\n');

    fs.writeFileSync(path.join(__dirname, 'hem_tags_content.txt'), logStr);
    console.log('Written to hem_tags_content.txt');

} catch (e) {
    console.error(e);
}
