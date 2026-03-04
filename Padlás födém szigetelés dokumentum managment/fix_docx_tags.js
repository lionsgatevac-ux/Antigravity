const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, 'templates');
const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));

console.log('--- FIX STARTED ---');

templateFiles.forEach(file => {
    const filePath = path.join(templatesDir, file);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);

        let xml;
        try {
            xml = zip.file('word/document.xml').asText();
        } catch (e) {
            console.log(`[SKIPPING] ${file}: Could not read word/document.xml`);
            return;
        }

        // Regex to find [[...]] tags that contain keywords but lack % prefix
        // We capture the inner content. 
        // Logic: 
        // 1. Matches [[ 
        // 2. (?!%) ensures no % immediately follows
        // 3. Capture group 1: any content that contains one of the keywords
        // 4. Matches ]]
        const tagRegex = /\[\[(?!%)([^\]]*?(?:alairas|belyegzo|alaprajz|logo)[^\]]*?)\]\]/g;

        let replaceCount = 0;
        const modifiedXml = xml.replace(tagRegex, (match, innerContent) => {
            console.log(`[FIXING] File: ${file} | Tag: ${match} -> [[%${innerContent}]]`);
            replaceCount++;
            return `[[%${innerContent}]]`;
        });

        if (replaceCount > 0) {
            zip.file('word/document.xml', modifiedXml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ [SAVED] ${file}: Fixed ${replaceCount} tags.`);
        } else {
            console.log(`[OK] ${file}: No tags needed fixing.`);
        }

    } catch (err) {
        console.error(`❌ [ERROR] Processing ${file}:`, err.message);
    }
});

console.log('--- FIX FINISHED ---');
