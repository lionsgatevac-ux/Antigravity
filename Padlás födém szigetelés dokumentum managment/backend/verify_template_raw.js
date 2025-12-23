const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Find ALL occurrences of signature-related text
console.log('=== SEARCHING FOR SIGNATURE TAGS IN TEMPLATE ===\n');

// Search for the actual tag delimiters and content
const patterns = [
    'alairasugyfel',
    'alairaskivitelezo',
    '%alairasugyfel',
    '%alairaskivitelezo'
];

patterns.forEach(pattern => {
    const count = (xml.match(new RegExp(pattern, 'g')) || []).length;
    console.log(`"${pattern}": ${count} occurrences`);
});

// Find actual tag structures
console.log('\n=== ACTUAL TAG CONTENT ===\n');
const tagRegex = /\[\[[^\]]{0,50}\]\]/g;
const tags = xml.match(tagRegex) || [];
const signatureTags = tags.filter(t => t.toLowerCase().includes('alair'));

console.log('Signature-related tags found:');
signatureTags.forEach(tag => {
    console.log(`  ${tag}`);
});

if (signatureTags.length === 0) {
    console.log('  ❌ NO signature tags found!');
}

// Check if % is inside the tags
const hasPercentInTags = signatureTags.some(tag => tag.includes('%'));
console.log(`\n% prefix present in tags: ${hasPercentInTags ? '✅ YES' : '❌ NO'}`);
