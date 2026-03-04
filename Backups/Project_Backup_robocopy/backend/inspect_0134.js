const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generated/megallapodas_hem_BOZSO-2025-0134.docx');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    console.log('\nSearching for BOZSO-2025-0134...');
    const files = fs.readdirSync(path.join(__dirname, 'generated'));
    const matching = files.filter(f => f.includes('0134'));
    console.log('Matching files:', matching);
    process.exit(1);
}

console.log('Inspecting:', filePath);
console.log('File size:', fs.statSync(filePath).size, 'bytes');
console.log('Modified:', fs.statSync(filePath).mtime);

const content = fs.readFileSync(filePath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Check for Base64
const hasBase64 = xml.includes('data:image/png;base64,');
const base64Count = (xml.match(/data:image\/png;base64,/g) || []).length;

// Check for images
const imageCount = (xml.match(/<w:drawing>/g) || []).length;

console.log('\n=== RESULTS ===');
console.log('Has raw Base64:', hasBase64);
console.log('Base64 count:', base64Count);
console.log('Image count:', imageCount);

if (hasBase64) {
    console.log('\n❌ FILE CONTAINS BASE64 TEXT (BAD)');

    // Find first occurrence
    const idx = xml.indexOf('data:image/png;base64,');
    const before = xml.substring(Math.max(0, idx - 100), idx);
    const after = xml.substring(idx, Math.min(xml.length, idx + 100));

    console.log('\nContext of Base64:');
    console.log('Before:', before.substring(before.length - 50));
    console.log('At:', after.substring(0, 50) + '...');
} else {
    console.log('\n✅ NO BASE64 TEXT FOUND (GOOD)');
}

if (imageCount > 0) {
    console.log(`✅ Found ${imageCount} images`);
} else {
    console.log('❌ NO IMAGES FOUND');
}
