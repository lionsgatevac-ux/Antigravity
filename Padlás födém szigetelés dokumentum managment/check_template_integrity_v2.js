const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, 'templates');
const referenceFile = path.join(__dirname, 'HELYES_FAJL_SZERVERROL.docx');
const outputFile = path.join(__dirname, 'integrity_report.txt');

const logStream = fs.createWriteStream(outputFile);

function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

function checkFile(filePath) {
    const name = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
        log(`❌ [${name}] MISSING`);
        return;
    }

    const stats = fs.statSync(filePath);
    log(`\n📄 [${name}]`);
    log(`   Path: ${filePath}`);
    log(`   Size: ${stats.size} bytes`);
    log(`   Modified: ${stats.mtime.toISOString()}`);

    if (stats.size === 0) {
        log(`   ❌ CORRUPTED: Size is 0`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        const xml = zip.file('word/document.xml');
        if (xml) {
            log(`   ✅ VALID DOCX`);
            const text = xml.asText();
            log(`   Length of document.xml: ${text.length} chars`);
        } else {
            log(`   ⚠️ WARNING: Valid ZIP but 'word/document.xml' not found`);
        }
    } catch (e) {
        log(`   ❌ INVALID ZIP: ${e.message}`);
    }
}

log("--- Checking Templates Directory ---");
if (fs.existsSync(templatesDir)) {
    const files = fs.readdirSync(templatesDir);
    files.forEach(f => {
        if (f.endsWith('.docx')) {
            checkFile(path.join(templatesDir, f));
        }
    });
} else {
    log("Templates directory not found!");
}

log("\n--- Checking Reference File ---");
checkFile(referenceFile);

logStream.end();
