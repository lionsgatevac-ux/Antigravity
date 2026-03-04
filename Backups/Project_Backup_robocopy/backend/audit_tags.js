const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const text = zip.files['word/document.xml'].asText();

    // Simple regex to find things that look like tags
    const tagRegex = /\[\[(?<tag>[^\]]+)\]\]/g;
    let match;
    const tags = [];

    console.log('--- Scanning matching tags in XML content ---');
    while ((match = tagRegex.exec(text)) !== null) {
        console.log(`Found tag: ${match[0]}`);
        tags.push(match[0]);
    }

    // Also look for split tags (Docxtemplater Inspector style)
    // This is a rough check.

    if (text.includes('alairasugyfel')) {
        console.log('\n--- Context for "alairasugyfel" ---');
        // Get context around occurrences
        const indices = [];
        let pos = text.indexOf('alairasugyfel');
        while (pos !== -1) {
            indices.push(pos);
            pos = text.indexOf('alairasugyfel', pos + 1);
        }

        indices.forEach(idx => {
            const start = Math.max(0, idx - 100);
            const end = Math.min(text.length, idx + 100);
            console.log(`...${text.substring(start, end)}...`);
        });
    }

} catch (e) {
    console.error('Error:', e);
}
