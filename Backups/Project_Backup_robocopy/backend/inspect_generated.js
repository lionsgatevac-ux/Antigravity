const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Get the file user just generated
const genPath = path.join(__dirname, 'generated/megallapodas_hem_BOZSO-2025-0133.docx');

if (!fs.existsSync(genPath)) {
    console.error('File not found:', genPath);
    process.exit(1);
}

const content = fs.readFileSync(genPath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

//Check for issues
console.log('=== INSPECTION OF GENERATED DOCUMENT ===\n');

if (xml.includes('data:image/png;base64,')) {
    console.log('❌ PROBLEM: Document contains raw "data:image/png;base64," string');

    // Find where it appears
    const idx = xml.indexOf('data:image/png;base64,');
    const context = xml.substring(Math.max(0, idx - 100), idx + 200);
    console.log('\nContext:');
    console.log(context);

    // Count how many times
    const count = (xml.match(/data:image\/png;base64,/g) || []).length;
    console.log(`\nFound ${count} occurrences of raw base64 data string`);
} else {
    console.log('✅ No raw base64 string found');
}

const drawingCount = (xml.match(/<w:drawing>/g) || []).length;
console.log(`\nImage count: ${drawingCount} <w:drawing> tags found`);

const unreplacedTags = xml.match(/\[\[%?[a-z]+\]\]/g);

const results = {
    hasRawBase64: xml.includes('data:image/png;base64,'),
    base64Count: (xml.match(/data:image\/png;base64,/g) || []).length,
    drawingCount: drawingCount,
    unreplacedTags: unreplacedTags || []
};

fs.writeFileSync(path.join(__dirname, 'inspection_results.json'), JSON.stringify(results, null, 2));
console.log('Results written to inspection_results.json');
console.log(JSON.stringify(results, null, 2));
