const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = 'c:\\Users\\Admin\\OneDrive\\Asztali gép\\Antigravity\\Padlás födém szigetelés dokumentum managment\\templates';

function listTags() {
    try {
        const file = 'kivitelezesi_szerzodes.docx';
        const filePath = path.join(templatesDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`File NOT FOUND: ${filePath}`);
            return;
        }
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        const xml = zip.file('word/document.xml').asText();

        const tags = xml.match(/\[\[.*?\]\]/g) || [];
        console.log(`--- Tags in ${file} ---`);
        const uniqueTags = [...new Set(tags)];
        uniqueTags.forEach(t => console.log(t));

    } catch (error) {
        console.error('Failed to list tags:', error);
    }
}

listTags();
