const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates';

function searchTags() {
    try {
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));
        console.log(`Searching for "alaprajz" in ${files.length} templates...`);

        files.forEach(file => {
            const filePath = path.join(templatesDir, file);
            const content = fs.readFileSync(filePath);
            const zip = new PizZip(content);
            const xml = zip.file('word/document.xml').asText();

            if (xml.includes('alaprajz')) {
                console.log(`[FOUND] ${file}`);
                // Check if it's clean or fractured
                if (xml.includes('[[alaprajz]]') || xml.includes('[[%alaprajz]]')) {
                    console.log(`  -> Clean tag found: ${xml.includes('[[%alaprajz]]') ? '[[%alaprajz]]' : '[[alaprajz]]'}`);
                } else {
                    console.log(`  -> FRACTURED tag likely present (mentions "alaprajz" but not as clean tag)`);
                    const index = xml.indexOf('alaprajz');
                    console.log(`  Context: ${xml.substring(index - 50, index + 100)}`);
                }
            }
        });
    } catch (error) {
        console.error('Search failed:', error);
    }
}

searchTags();
