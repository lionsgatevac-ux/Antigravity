const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const templates = ['megallapodas_hem.docx', 'kivitelezoi_nyilatkozat.docx', 'tamogatas_ligenylo.docx'];

const output = [];
const log = (msg) => {
    console.log(msg);
    output.push(msg);
};

// Try to find the correct tamogatas file if hardcoded name is wrong
if (!fs.existsSync(path.join(__dirname, 'templates', 'tamogatas_ligenylo.docx'))) {
    // Check if it's named differently
    const dir = path.join(__dirname, 'templates');
    const files = fs.readdirSync(dir);
    const tamogatas = files.find(f => f.includes('tamogatas'));
    if (tamogatas) {
        log(`Adjusting tamogatas filename to: ${tamogatas}`);
        templates[2] = tamogatas;
    }
}

templates.forEach(file => {
    const filePath = path.join(__dirname, 'templates', file);
    if (!fs.existsSync(filePath)) {
        log(`❌ File not found: ${file}`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        const xml = zip.file('word/document.xml').asText();

        log(`\n--- Checking ${file} ---`);

        // List ALL tags (strict match)
        log(`--- RAW XML TAGS ---`);
        const allTags = xml.match(/\[\[.*?\]\]/g) || [];
        if (allTags.length === 0) log("No strict tags found.");
        allTags.forEach(t => log(t));

        // Check stripped content for tags hidden by XML (Split tags)
        const textContent = xml.replace(/<[^>]+>/g, '');
        const visibleTags = textContent.match(/\[\[.*?\]\]/g) || [];
        log(`--- VISIBLE TAGS (stripped XML) ---`);
        if (visibleTags.length === 0) log("No visible tags found.");
        visibleTags.forEach(t => log(t));

    } catch (e) {
        log(`Error reading ${file}: ${e.message}`);
    }
});

fs.writeFileSync('template_check_result.txt', output.join('\n'));
