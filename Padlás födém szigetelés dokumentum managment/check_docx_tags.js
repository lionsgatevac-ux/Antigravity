const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, 'templates');
const targetFile = 'tamogatas_kerelem.docx'; // Guessing name, will list first
const filePath = path.join(templatesDir, targetFile);

console.log(`--- INSPECTING ${targetFile} ---`);

try {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);

    // Find all XML files that might contain text
    const xmlFiles = Object.keys(zip.files).filter(f =>
        f.startsWith('word/') && f.endsWith('.xml')
    );

    let allTags = [];

    xmlFiles.forEach(fileName => {
        const xml = zip.file(fileName).asText();
        // Strip ALL XML tags to get pure text content (simulating what human sees)
        const textContent = xml.replace(/<[^>]+>/g, '');

        const keywords = ['alairas', 'belyegzo', 'alaprajz', 'logo', 'nevtakaritas', 'brszamoltertek'];

        keywords.forEach(kw => {
            if (textContent.includes(kw)) {
                console.log(`FOUND KEYWORD "${kw}" in ${fileName}`);
                // Find context (10 chars before and after)
                const index = textContent.indexOf(kw);
                const start = Math.max(0, index - 20);
                const end = Math.min(textContent.length, index + kw.length + 20);
                console.log(`   Context: ...${textContent.substring(start, end).replace(/\n/g, ' ')}...`);
            }
        });

        // Also check for tags
        const tagRegex = /\[\[(.*?)\]\]/g;
        const matches = [...textContent.matchAll(tagRegex)];

        matches.forEach(m => {
            allTags.push({ tag: m[1], file: fileName });
        });
    });

    console.log(`Total tags found: ${allTags.length}`);
    console.log('--- ALL TAGS ---');
    allTags.forEach(item => console.log(`${item.tag}  [${item.file}]`));
    console.log('----------------');

} catch (err) {
    console.error(`Error processing ${targetFile}:`, err.message);
}
