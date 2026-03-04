const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

try {
    const content = fs.readFileSync(path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx'), 'binary');
    const zip = new PizZip(content);

    // Check main document body
    const xml = zip.files['word/document.xml'].asText();

    const reportPath = path.join(__dirname, 'audit_report.txt');
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(reportPath, msg + '\n');
    };

    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);

    log('--- TEMPLATE AUDIT REPORT ---');

    // Count simple text tags
    const textTagMatches = xml.match(/\[\[alairasugyfel\]\]/g);
    log(`Found strict text tags [[alairasugyfel]]: ${textTagMatches ? textTagMatches.length : 0}`);

    // Count image tags
    const imageTagMatches = xml.match(/\[\[%alairasugyfel\]\]/g);
    log(`Found strict image tags [[%alairasugyfel]]: ${imageTagMatches ? imageTagMatches.length : 0}`);

    // Count split/fuzzy occurrences
    const rawMatches = xml.match(/alairasugyfel/g);
    log(`Found 'alairasugyfel' string total occurrences: ${rawMatches ? rawMatches.length : 0}`);

    if (rawMatches && rawMatches.length > 0) {
        log('\nContexts found:');
        let pos = 0;
        let count = 0;
        while (pos !== -1) {
            pos = xml.indexOf('alairasugyfel', pos);
            if (pos !== -1) {
                count++;
                const start = Math.max(0, pos - 100); // Expanded context
                const end = Math.min(xml.length, pos + 100);
                log(`\n--- MATCH #${count} ---`);
                log(xml.substring(start, end));
                pos += 1;
            }
        }
    }

    // Check headers and footers too
    Object.keys(zip.files).forEach(fileName => {
        if (fileName.startsWith('word/header') || fileName.startsWith('word/footer')) {
            const hfXml = zip.files[fileName].asText();
            if (hfXml.includes('alairasugyfel')) {
                console.log(hfXml.substring(hfXml.indexOf('alairasugyfel') - 20, hfXml.indexOf('alairasugyfel') + 20));
            }
        }
    });

} catch (e) {
    console.error('Audit failed:', e);
}
