const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// Check all templates
const templatesDir = path.join(__dirname, '..', 'templates');
const templates = [
    'kivitelezesi_szerzodes.docx',
    'kivitelezoi_nyilatkozat.docx',
    'atadas_atveteli.docx',
    'megallapodas_hem.docx'
];

console.log('🔍 Searching for alairasugyfel in all templates...\n');

templates.forEach(templateName => {
    const templatePath = path.join(templatesDir, templateName);

    if (!fs.existsSync(templatePath)) {
        console.log(`❌ ${templateName} - NOT FOUND`);
        return;
    }

    try {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const docXml = zip.files['word/document.xml'].asText();

        // Search for all variations of alairasugyfel
        const patterns = [
            /\[\[alairasugyfel\]\]/g,
            /\[\[%alairasugyfel\]\]/g,
            /alairasugyfel/g
        ];

        console.log(`\n📄 ${templateName}`);
        console.log('='.repeat(50));

        let foundAny = false;

        patterns.forEach((pattern, index) => {
            const matches = docXml.match(pattern);
            if (matches) {
                foundAny = true;
                const patternName = ['[[alairasugyfel]] (TEXT)', '[[%alairasugyfel]] (IMAGE)', 'alairasugyfel (any)'][index];
                console.log(`✅ Found ${matches.length} instances of ${patternName}`);

                // Show context for each match
                if (index < 2) { // Only show context for [[...]] patterns
                    matches.forEach((match, i) => {
                        const matchIndex = docXml.indexOf(match);
                        const context = docXml.substring(matchIndex - 50, matchIndex + 100);
                        console.log(`   Context ${i + 1}: ...${context}...`);
                    });
                }
            }
        });

        if (!foundAny) {
            console.log('❌ No instances of alairasugyfel found');
        }

    } catch (err) {
        console.log(`❌ Error processing ${templateName}:`, err.message);
    }
});

console.log('\n' + '='.repeat(50));
console.log('✅ Analysis complete!');
