const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const sizeOf = require('image-size');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');
const outputPath = path.join(__dirname, '../generated/verify_test.docx');

// Simple 1x1 pixel blue dot base64 png
const DUMMY_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
// The raw base64 part that would show up in text if failed
const RAW_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

try {
    console.log('--- STARTING VERIFICATION ---');

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let customerSignatureCount = 0;
    const opts = {};
    opts.centered = false;
    opts.getImage = (tagValue, tagName) => {
        // console.log('getImage called', tagName);
        if (tagName === 'alairasugyfel') {
            customerSignatureCount++;
            console.log(`[Verify] Customer signature tag found! (Count: ${customerSignatureCount})`);
        }
        const base64Data = tagValue.replace(/data:image\/[a-zA-Z0-9+]+;base64,\s*/, "").trim();
        return Buffer.from(base64Data, 'base64');
    };
    opts.getSize = () => [100, 100];

    const imageModule = new ImageModule(opts);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule],
        delimiters: { start: '[[', end: ']]' }
    });

    // Data simulating the issue
    const data = {
        contract_number: "TEST-001",
        alairasugyfel: DUMMY_SIGNATURE, // The critical field
        alairaskivitelezo: DUMMY_SIGNATURE
    };

    doc.render(data);

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buf);
    console.log('Document generated at:', outputPath);

    // ANALYZE OUTPUT
    const outZip = new PizZip(buf);
    const xml = outZip.files['word/document.xml'].asText();

    if (xml.includes(RAW_BASE64)) {
        console.error('❌ FAILED: Found raw base64 string in the document XML!');
        console.error('This means the tag [[alairasugyfel]] was treated as TEXT, not an IMAGE.');
    } else {
        console.log('✅ PASSED: Raw base64 string NOT found in XML text.');
        console.log('This means Docxtemplater likely processed it as an image.');

        // Double check if image tag logic worked
        if (xml.includes('alairasugyfel')) {
            console.log('⚠️ WARNING: The text "alairasugyfel" is still present in XML. Might be a label or unused tag?');
        }
    }

} catch (e) {
    console.error('CRITICAL ERROR:', e);
}
