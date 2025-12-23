const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templates = [
    'kivitelezesi_szerzodes.docx',
    'atadas_atveteli.docx',
    'kivitelezoi_nyilatkozat.docx',
    'megallapodas_hem.docx'
];

templates.forEach(templateName => {
    const templatePath = path.join(__dirname, '../templates', templateName);
    console.log(`\n--- TAGS IN ${templateName} ---`);
    if (!fs.existsSync(templatePath)) {
        console.log(`Template not found at: ${templatePath}`);
        return;
    }

    try {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const xml = zip.files['word/document.xml'].asText();

        // Match both regular tags and image tags (that might start with %)
        // And also account for potential splitting by XML tags
        // However, a simple match is a good start. 
        // A more advanced one would strip all XML tags between [[ and ]]

        const cleanXml = xml.replace(/<[^>]+>/g, '');
        const matches = cleanXml.match(/\[\[(.*?)\]\]/g);

        if (matches) {
            const uniqueTags = [...new Set(matches)];
            uniqueTags.sort();
            uniqueTags.forEach(t => console.log(t));
        } else {
            console.log('No tags found.');
        }

    } catch (e) {
        console.error(`Error processing ${templateName}:`, e.message);
    }
});
