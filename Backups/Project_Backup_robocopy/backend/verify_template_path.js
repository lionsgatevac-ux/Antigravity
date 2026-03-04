const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');

// Simulate what documentGenerator.js does
const templatesDir = path.join(__dirname, '..', '..', 'templates');
const templateName = 'megallapodas_hem';
const templatePath = path.join(templatesDir, `${templateName}.docx`);

console.log('=== TEMPLATE LOADING PATH VERIFICATION ===\n');
console.log('Templates directory:', templatesDir);
console.log('Template path:', templatePath);
console.log('File exists:', fs.existsSync(templatePath));

if (!fs.existsSync(templatePath)) {
    console.error('\n❌ CRITICAL: Template file NOT FOUND!');
    console.log('\nSearching for megallapodas_hem.docx files...');
    // Find all occurrences
    const exec = require('child_process').execSync;
    try {
        const result = exec('dir /s /b megallapodas_hem.docx', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf-8' });
        console.log(result);
    } catch (e) {
        console.log('No files found or search error');
    }
    process.exit(1);
}

console.log('\n=== TEMPLATE CONTENT ANALYSIS ===\n');

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Extract ALL tags
const allTags = xml.match(/\[\[[^\]]+\]\]/g) || [];
console.log(`Total tags in template: ${allTags.length}`);

// Find signature-related tags
const signatureTags = allTags.filter(tag =>
    tag.includes('alair') || tag.includes('signature') || tag.includes('ugyfel') || tag.includes('kivitelez')
);

console.log(`\nSignature-related tags found: ${signatureTags.length}`);
signatureTags.forEach(tag => {
    const hasPercent = tag.includes('%');
    const status = hasPercent ? '✓' : '✗';
    console.log(`  ${status} ${tag}`);
});

if (signatureTags.length === 0) {
    console.log('\n⚠️  NO signature tags found in template!');
} else {
    const allHavePercent = signatureTags.every(tag => tag.includes('%'));
    if (allHavePercent) {
        console.log('\n✓ All signature tags have % prefix - template is correct');
    } else {
        console.log('\n✗ Some signature tags are MISSING % prefix!');
        console.log('\nAttempting auto-fix...');

        // Fix
        let fixedXml = xml;
        fixedXml = fixedXml.replace(/\[\[(\s*)alairasugyfel(\s*)\]\]/g, '[[%alairasugyfel]]');
        fixedXml = fixedXml.replace(/\[\[(\s*)alairaskivitelezo(\s*)\]\]/g, '[[%alairaskivitelezo]]');
        fixedXml = fixedXml.replace(/\[\[(\s*)alaprajz(\s*)\]\]/g, '[[%alaprajz]]');

        // Backup and save
        const backup = templatePath.replace('.docx', '_emergency_backup.docx');
        fs.copyFileSync(templatePath, backup);
        console.log(`Created backup: ${backup}`);

        zip.file('word/document.xml', fixedXml);
        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log('✓ Template fixed and saved');
    }
}

console.log('\n=== VERIFICATION COMPLETE ===');
