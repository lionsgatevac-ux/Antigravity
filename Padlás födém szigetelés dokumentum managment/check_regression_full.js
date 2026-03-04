const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const logFile = path.join(__dirname, 'template_check_result.txt');
fs.writeFileSync(logFile, ''); // Clear log

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

const templatesDir = path.join(__dirname, 'templates');
const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));

templateFiles.forEach(fileName => {
    const filePath = path.join(templatesDir, fileName);
    log(`\n--- Listing ALL TAGS in ${fileName} ---`);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        let xml = zip.file('word/document.xml').asText();

        // 1. Raw XML dump of anything looking like [[...]]
        // This catches tags split across XML nodes if they still have [[ and ]]
        // But better is to just look for [[ and ]] separately or use a loose regex
        const allTags = xml.match(/\[\[.*?\]\]/g) || [];

        // 2. Try to find split tags by looking for "[[%" or "[[" followed by "cim" or "hrsz" with XML in between
        // Identifying potential split image tags
        const splitImageTags = xml.match(/\[\[%[\s\S]*?\]\]/g) || [];

        if (allTags.length > 0) {
            allTags.forEach(t => log(`TAG: ${t}`));
        } else {
            log('No standard tags found.');
        }

        if (splitImageTags.length > 0) {
            log('--- POTENTIAL SPLIT IMAGE TAGS ---');
            splitImageTags.forEach(t => log(`SPLIT: ${t}`));
        }

    } catch (e) {
        log(`Error reading ${fileName}: ${e.message}`);
    }
});
