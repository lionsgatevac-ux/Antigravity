const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates';

function searchAggressive() {
    try {
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));
        const results = [];

        files.forEach(file => {
            const filePath = path.join(templatesDir, file);
            const content = fs.readFileSync(filePath);
            const zip = new PizZip(content);
            const xml = zip.file('word/document.xml').asText();

            if (xml.toLowerCase().includes('alaprajz')) {
                // Find all occurrences of [[...alaprajz...]]
                const matches = xml.match(/\[\[[^\]]*?alaprajz[^\]]*?\]\]/g) || [];
                results.push(`FILE: ${file}`);
                if (matches.length > 0) {
                    matches.forEach(m => results.push(`  TAG: ${m}`));
                } else {
                    results.push(`  Mentioned but NO tag found.`);
                }
            }
        });

        fs.writeFileSync('aggressive_alaprajz_search.txt', results.join('\n'));
        console.log('Results written to aggressive_alaprajz_search.txt');
    } catch (error) {
        console.error('Search failed:', error);
    }
}

searchAggressive();
