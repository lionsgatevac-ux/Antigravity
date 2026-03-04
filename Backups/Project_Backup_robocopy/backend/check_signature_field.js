const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatePath = path.join(__dirname, '..', 'templates', 'kivitelezesi_szerzodes.docx');

if (!fs.existsSync(templatePath)) {
    console.log('Template not found!');
    process.exit(1);
}

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const docXml = zip.files['word/document.xml'].asText();

// Search for alairasugyfel
console.log('Searching for alairasugyfel patterns...\n');

// Pattern 1: [[alairasugyfel]] (TEXT - WRONG)
const textPattern = /\[\[alairasugyfel\]\]/g;
const textMatches = docXml.match(textPattern);
if (textMatches) {
    console.log(`❌ FOUND ${textMatches.length} TEXT instances: [[alairasugyfel]]`);
    console.log('   This is WRONG - it will display base64 as text!\n');
}

// Pattern 2: [[%alairasugyfel]] (IMAGE - CORRECT)
const imagePattern = /\[\[%alairasugyfel\]\]/g;
const imageMatches = docXml.match(imagePattern);
if (imageMatches) {
    console.log(`✅ FOUND ${imageMatches.length} IMAGE instances: [[%alairasugyfel]]`);
    console.log('   This is CORRECT - it will display as image\n');
}

// Save XML for manual inspection
const xmlPath = path.join(__dirname, 'template_document.xml');
fs.writeFileSync(xmlPath, docXml);
console.log(`✅ Full XML saved to: ${xmlPath}`);
console.log(`   You can search for "alairasugyfel" in this file\n`);

// Summary
if (textMatches && textMatches.length > 0) {
    console.log('🔧 ACTION REQUIRED:');
    console.log('   Replace [[alairasugyfel]] with [[%alairasugyfel]] in the template');
} else if (!textMatches && !imageMatches) {
    console.log('⚠️  WARNING: No alairasugyfel found in template!');
} else {
    console.log('✅ Template looks correct!');
}
