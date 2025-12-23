const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatePath = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates\\atadas_atveteli.docx';

function inspectTemplate() {
    try {
        console.log(`Inspecting template: ${templatePath}`);
        const content = fs.readFileSync(templatePath);
        const zip = new PizZip(content);
        const xml = zip.file('word/document.xml').asText();

        // Find all tags matching [[...]]
        // Note: they might be fractured in XML like [[ <other tags> szemelyi ]]
        // So first we list all [[...]] that are ALREADY clean
        const cleanTags = xml.match(/\[\[.*?\]\]/g) || [];
        console.log('--- Clean [[Tags]] found ---');
        [...new Set(cleanTags)].sort().forEach(tag => console.log(tag));

        // Now look for "szemelyi" or "szemely" anywhere in the XML
        const lowerXml = xml.toLowerCase();
        const searchTerms = ['szem', 'igazol'];

        searchTerms.forEach(term => {
            if (lowerXml.includes(term.toLowerCase())) {
                console.log(`\n--- Found "${term}" in XML ---`);
                let index = lowerXml.indexOf(term.toLowerCase());
                while (index !== -1) {
                    console.log('Context:', xml.substring(Math.max(0, index - 50), Math.min(xml.length, index + 150)));
                    index = lowerXml.indexOf(term.toLowerCase(), index + 1);
                    if (index === -1 || index > lowerXml.indexOf(term.toLowerCase()) + 1000) break; // Limit context search
                }
            }
        });

    } catch (error) {
        console.error('Inspection failed:', error);
    }
}

inspectTemplate();
