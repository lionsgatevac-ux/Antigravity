const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates';
const output = [];

function searchTags() {
    try {
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));
        output.push(`Searching for "alaprajz" in ${files.length} templates...`);

        files.forEach(file => {
            const filePath = path.join(templatesDir, file);
            const content = fs.readFileSync(filePath);
            const zip = new PizZip(content);
            const xml = zip.file('word/document.xml').asText();

            if (xml.toLowerCase().includes('alaprajz')) {
                output.push(`[FOUND] ${file}`);
                if (xml.includes('[[alaprajz]]') || xml.includes('[[%alaprajz]]')) {
                    output.push(`  -> Clean tag found: ${xml.includes('[[%alaprajz]]') ? '[[%alaprajz]]' : '[[alaprajz]]'}`);
                } else if (xml.match(/\[\[.*?alaprajz.*?\]\]/)) {
                    output.push(`  -> FRACTURED tag found: ${xml.match(/\[\[.*?alaprajz.*?\]\]/)[0]}`);
                } else {
                    output.push(`  -> Reference found but no tag detected.`);
                }
            }
        });

        fs.writeFileSync('alaprajz_search_results.txt', output.join('\n'));
        console.log('Results written to alaprajz_search_results.txt');
    } catch (error) {
        console.error('Search failed:', error);
    }
}

searchTags();
