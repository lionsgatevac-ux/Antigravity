const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generated/megallapodas_hem_BOZSO-2025-0136.docx');

if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

const hasBase64 = xml.includes('data:image/png;base64,');
const imageCount = (xml.match(/<w:drawing>/g) || []).length;

console.log('=== BOZSO-2025-0136 SERVER FILE CHECK ===');
console.log('File size:', fs.statSync(filePath).size, 'bytes');
console.log('Has raw Base64:', hasBase64 ? '❌ YES (BROKEN!)' : '✅ NO');
console.log('Image count:', imageCount);

if (hasBase64) {
    console.log('\n❌❌❌ THE SERVER FILE IS ACTUALLY BROKEN!');
    console.log('The generation itself is producing bad files!');
    console.log('This means the template or image module is NOT working.');
} else {
    console.log('\n✅ Server file is correct - must be download issue');
}
