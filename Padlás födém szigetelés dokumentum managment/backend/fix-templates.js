const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, '..', 'templates');
console.log(`Looking for templates in: ${templatesDir}`);

if (!fs.existsSync(templatesDir)) {
    console.error(`Templates directory not found!`);
    process.exit(1);
}

const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));

files.forEach(file => {
    console.log(`Processing ${file}...`);
    const filePath = path.join(templatesDir, file);

    try {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);

        let changed = false;
        const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));

        xmlFiles.forEach(xmlPath => {
            let xml = zip.file(xmlPath).asText();
            let fileChanged = false;

            // STRATEGY: Replace ANY sequence of { with [[
            // Regex: /\{+/g
            if (xml.match(/\{+/)) {
                xml = xml.replace(/\{+/g, '[[');
                fileChanged = true;
            }

            // STRATEGY: Replace ANY sequence of } with ]]
            // Regex: /\}+/g
            if (xml.match(/\}+/)) {
                xml = xml.replace(/\}+/g, ']]');
                fileChanged = true;
            }

            if (fileChanged) {
                zip.file(xmlPath, xml);
                changed = true;
                console.log(`    Converted curly to square brackets in ${xmlPath}`);
            }
        });

        if (changed) {
            console.log(`  Saving changes to ${file}`);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buffer);
        } else {
            console.log(`  No changes needed.`);
        }
    } catch (err) {
        console.error(`  Error processing ${file}:`, err.message);
    }
});

console.log('Done.');
