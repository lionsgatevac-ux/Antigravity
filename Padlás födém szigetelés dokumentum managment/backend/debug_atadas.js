const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const ImageModule = require('docxtemplater-image-module-free');
const sizeOf = require('image-size');

const templateName = 'atadas_atveteli.docx';
const templatePath = path.join(__dirname, '../templates', templateName);

console.log(`Debug script for: ${templateName}`);

try {
    if (!fs.existsSync(templatePath)) {
        console.error('Template NOT FOUND at:', templatePath);
        process.exit(1);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    console.log('\n--- 1. XML Search ---');
    const searchTerms = ['alairasugyfel', '%alairasugyfel'];
    let contextOutput = '';
    searchTerms.forEach(term => {
        const idx = xml.indexOf(term);
        if (idx !== -1) {
            contextOutput += `\nFOUND "${term}" at index ${idx}\n`;
            contextOutput += 'CONTEXT:\n';
            contextOutput += xml.substring(Math.max(0, idx - 200), Math.min(xml.length, idx + 200));
        } else {
            contextOutput += `\nNOT FOUND: "${term}"\n`;
        }
    });
    fs.writeFileSync(path.join(__dirname, 'debug_atadas_context.txt'), contextOutput);
    console.log('Saved debug_atadas_context.txt');

    console.log('\n--- 2. Generation Test ---');

    // Setup simple image module
    const opts = {};
    opts.centered = false;
    opts.getImage = (tagValue) => {
        console.log('[TestGen] getImage called for value length:', tagValue.length);
        const base64Regex = /data:image\/[a-zA-Z0-9+]+;base64,\s*/;
        return Buffer.from(tagValue.replace(base64Regex, ""), 'base64');
    };
    opts.getSize = () => [150, 50];

    const imageModule = new ImageModule(opts);

    const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        delimiters: { start: '[[', end: ']]' }
    });

    const data = {
        alairasugyfel: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        hrsz: "1234/5",
        nev: "Test User"
    };

    doc.render(data);

    // Check output xml
    const outZip = doc.getZip();
    const outXml = outZip.files['word/document.xml'].asText();

    if (outXml.includes('data:image')) {
        console.log('FAIL: "data:image" string found in output XML. Image NOT rendered.');
    } else if (outXml.includes('<w:drawing>')) {
        console.log('SUCCESS: <w:drawing> tag found in output. Image likely rendered.');
    } else {
        console.log('UNCLEAR: Neither data string nor drawing tag found.');
    }

    fs.writeFileSync(path.join(__dirname, 'debug_atadas_output.docx'), outZip.generate({ type: 'nodebuffer' }));
    console.log('Saved debug_atadas_output.docx');

} catch (e) {
    console.error('CRITICAL ERROR:', e);
}
