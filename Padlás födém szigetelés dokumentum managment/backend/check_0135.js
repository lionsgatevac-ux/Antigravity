const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generated/megallapodas_hem_BOZSO-2025-0135.docx');

if (!fs.existsSync(filePath)) {
    console.error('❌ File BOZSO-2025-0135 NOT FOUND on server!');
    console.log('Available files:');
    const files = fs.readdirSync(path.join(__dirname, 'generated'))
        .filter(f => f.includes('megallapodas_hem'))
        .sort()
        .slice(-5);
    files.forEach(f => {
        const stat = fs.statSync(path.join(__dirname, 'generated', f));
        console.log(`  - ${f} (${stat.size} bytes, ${stat.mtime})`);
    });
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

const hasBase64 = xml.includes('data:image/png;base64,');
const base64Count = (xml.match(/data:image\/png;base64,/g) || []).length;
const imageCount = (xml.match(/<w:drawing>/g) || []).length;

console.log('File:', path.basename(filePath));
console.log('Size:', fs.statSync(filePath).size, 'bytes');
console.log('');
console.log('Has Base64:', hasBase64 ? '❌ YES (BAD!)' : '✅ NO');
console.log('Base64 count:', base64Count);
console.log('Image count:', imageCount);

if (hasBase64 && imageCount === 0) {
    console.log('\n❌❌❌ SERVER FILE IS BROKEN - Generation is failing! ❌❌❌');
} else if (hasBase64 && imageCount > 0) {
    console.log('\n⚠️ Mixed: Has BOTH Base64 text AND images - partial failure');
} else if (imageCount > 0) {
    console.log('\n✅ SERVER FILE IS CORRECT - This is a download/cache issue!');
} else {
    console.log('\n⚠️ No images found at all');
}
