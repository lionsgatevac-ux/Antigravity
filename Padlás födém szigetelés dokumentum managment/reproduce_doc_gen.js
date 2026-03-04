const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Mock DocumentGenerator functionality
async function reproduce() {
    const templatesDir = path.join(__dirname, 'templates');
    const templateName = 'megallapodas_hem'; // Focus on the problematic template
    const templatePath = path.join(templatesDir, `${templateName}.docx`);

    console.log(`Loading template from: ${templatePath}`);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let doc;
    try {
        const ImageModule = require('docxtemplater-image-module-free');
        const sizeOf = require('image-size');
        const opts = {};
        opts.centered = false;
        opts.getImage = function (tagValue, tagName) {
            return Buffer.from(tagValue, 'binary');
        };
        opts.getSize = function (img, tagValue, tagName) {
            return [150, 50];
        };
        const imageModule = new ImageModule(opts);

        doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            modules: [imageModule],
            delimiters: { start: '[[', end: ']]' },
            nullGetter: () => { return ""; }
        });
    } catch (e) {
        console.error("Image module error", e);
        doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    }

    const data = {
        // Simulating the issue: What if 'nev' or 'szuletesnev' contains base64 garbage?
        nev: 'Test User',
        szuletesnev: 'Test Birth Name',
        megtakaritas: 12345,
        brszamoltertek: '1 000 000 Ft',

        // Simulating Base64 injection in unexpected places
        // Maybe one of these is actually rendering as text?
        email: 'data:image/png;base64,SHORT_BASE64_STRING_FOR_TESTING',
        telefonszam: 'data:image/png;base64,ANOTHER_BASE64_STRING',

        // Correct image data
        alairasugyfel: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    console.log('Rendering with data...');

    doc.render(data);

    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    fs.writeFileSync('reproduction_output.docx', buf);
    console.log('Generated reproduction_output.docx');

    // Analyze output for base64 text
    const xml = doc.getZip().files['word/document.xml'].asText();
    if (xml.includes('SHORT_BASE64_STRING_FOR_TESTING')) {
        console.log('⚠️  FOUND BASE64 TEXT IN DOCUMENT! (Field: email)');
    }
    if (xml.includes('ANOTHER_BASE64_STRING')) {
        console.log('⚠️  FOUND BASE64 TEXT IN DOCUMENT! (Field: telefonszam)');
    }

    // Check for signature leakage
    const sigBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    if (xml.includes(sigBase64)) {
        console.log('❌ FAILURE: Signature rendered as text! The % prefix is likely missing or logic is wrong.');
    } else {
        console.log('✅ SUCCESS: Signature NOT found as text (likely rendered as image).');
    }
}

reproduce().catch(console.error);
