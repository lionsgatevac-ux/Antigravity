const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatePath = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates\\atadas_atveteli.docx';
const outputPath = path.join(__dirname, 'tags_atadas.txt');

function inspectTemplate() {
    try {
        console.log(`Inspecting template: ${templatePath}`);
        const content = fs.readFileSync(templatePath);
        const zip = new PizZip(content);
        const xml = zip.file('word/document.xml').asText();

        const cleanTags = xml.match(/\[\[.*?\]\]/g) || [];
        const result = [
            '--- Clean [[Tags]] found ---',
            ...([...new Set(cleanTags)].sort())
        ];

        // Specific search for "szemelyi" parts
        if (xml.includes('szemelyi')) {
            result.push('\n--- Clean "szemelyi" tag found! ---');
        } else {
            result.push('\n--- "szemelyi" tag NOT found as a whole! ---');
            // Look for parts
            const parts = ['[[', 'szem', 'elyi', ']]'];
            parts.forEach(p => {
                result.push(`Part "${p}" exists: ${xml.includes(p)}`);
            });
        }

        fs.writeFileSync(outputPath, result.join('\n'));
        console.log(`Results written to: ${outputPath}`);

    } catch (error) {
        console.error('Inspection failed:', error);
    }
}

inspectTemplate();
