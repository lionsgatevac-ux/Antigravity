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

// Focus on the reported file first, then check others
const targetFiles = ['2026 atadas_atveteli.docx', 'kivitelezesi_szerzodes.docx'];

// Add other files if they exist
templateFiles.forEach(f => {
    if (!targetFiles.includes(f)) targetFiles.push(f);
});


targetFiles.forEach(fileName => {
    const filePath = path.join(templatesDir, fileName);
    if (!fs.existsSync(filePath)) return;

    log(`\n--- Checking ${fileName} ---`);
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        let xml = zip.file('word/document.xml').asText();

        log('--- RAW XML TAGS (looking for %cim, %hrsz, etc) ---');
        // Match specific suspicious tags
        const suspiciousTags = xml.match(/\[\[%?(?:cim|hrsz|helyrajzi|iranyitoszam|varos|utca|hazszam).*?\]\]/g) || [];
        if (suspiciousTags.length > 0) {
            suspiciousTags.forEach(t => log(`SUSPICIOUS: ${t}`));
        } else {
            log('No suspicious address tags found with simple regex.');
        }

        // General tag dump
        const allTags = xml.match(/\[\[.*?\]\]/g) || [];
        // log('--- ALL TAGS ---');
        // allTags.forEach(t => log(t));

    } catch (e) {
        log(`Error reading ${fileName}: ${e.message}`);
    }
});
