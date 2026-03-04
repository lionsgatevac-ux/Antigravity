const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, 'templates');
const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));

console.log('--- COMPREHENSIVE FIX STARTED ---');

templateFiles.forEach(file => {
    const filePath = path.join(templatesDir, file);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);

        // Find all XML files that might contain text
        const xmlFiles = Object.keys(zip.files).filter(f =>
            f.startsWith('word/') && f.endsWith('.xml')
        );

        let replacedInFile = 0;

        xmlFiles.forEach(fileName => {
            let xml = zip.file(fileName).asText();

            // Regex to find [[...]] tags that contain keywords but lack % prefix
            // Keywords: alairas, belyegzo, alaprajz, logo, nevtakaritas, brszamoltertek, alairasugyfel, alairaskivitelezo
            // We capture the inner content
            const tagRegex = /\[\[(?!%)([^\]]*?(?:alairas|belyegzo|alaprajz|logo|nevtakaritas|brszamoltertek|alairasugyfel|alairaskivitelezo)[^\]]*?)\]\]/gi;

            let replaceCount = 0;
            const modifiedXml = xml.replace(tagRegex, (match, innerContent) => {
                // Double check it doesn't start with % (regex should handle it, but safety first)
                if (innerContent.trim().startsWith('%')) return match;

                console.log(`[FIXING] File: ${file} | Part: ${fileName} | Tag: ${match} -> [[%${innerContent}]]`);
                replaceCount++;
                return `[[%${innerContent}]]`;
            });

            if (replaceCount > 0) {
                zip.file(fileName, modifiedXml);
                replacedInFile += replaceCount;
            }
        });

        if (replacedInFile > 0) {
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ [SAVED] ${file}: Fixed ${replacedInFile} tags across all parts.`);
        } else {
            console.log(`[OK] ${file}: No tags needed fixing.`);
        }

    } catch (err) {
        console.error(`❌ [ERROR] Processing ${file}:`, err.message);
    }
});

console.log('--- COMPREHENSIVE FIX FINISHED ---');
