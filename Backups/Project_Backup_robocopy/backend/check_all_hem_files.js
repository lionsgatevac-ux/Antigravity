const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const files = fs.readdirSync(templatesDir).filter(f => f.includes('hem') && f.endsWith('.docx'));

console.log('=== CHECKING ALL HEM TEMPLATE FILES ===\n');

files.forEach(fileName => {
    const filePath = path.join(templatesDir, fileName);
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    const hasAlairas = xml.includes('alairasugyfel') || xml.includes('alairaskivitelezo');
    const hasPercent = xml.includes('%alairasugyfel') || xml.includes('%alairaskivitelezo');

    console.log(`${fileName}:`);
    console.log(`  Has signature tags:`, hasAlairas ? '✅' : '❌');
    console.log(`  Has % prefix:`, hasPercent ? '✅' : '❌');
    console.log('');
});
