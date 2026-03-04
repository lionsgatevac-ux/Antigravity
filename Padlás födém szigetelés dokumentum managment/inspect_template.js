const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

async function inspect() {
    const templatesDir = path.join(__dirname, 'templates');
    const templateName = 'megallapodas_hem';
    const templatePath = path.join(templatesDir, `${templateName}.docx`);

    console.log(`Loading template from: ${templatePath}`);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '[[', end: ']]' }
    });

    // Inspect module-parsed tokens (if possible) or internal tokens
    // Docxtemplater v3 exposes 'tokens' after setData/render? Or after compile (internal)
    // Actually, we can access 'doc.compiled' or 'doc.templatedFiles'
    // But easiest is to use a simple 'Lexer' approach or checking internal structure.

    // Force compilation by creating the module instance
    // doc.compile(); // This might be private.

    // Instead, let's look at the raw XML in 'word/document.xml' and 'word/footer2.xml'
    // The previous check script found 'nev' in footer2.xml. 

    // We already know from check_docx_tags.js output (Step 367):
    // %nev
    // %szuletesnev
    // ...
    // %alairasugyfel
    // nev

    // 'nev' is present as a text tag! in word/footer2.xml
    // 'nev' is NOT base64 in documentGenerator.js.

    // But what if 'alairas' is present in footer2.xml?
    const footerXml = zip.files['word/footer2.xml'] ? zip.files['word/footer2.xml'].asText() : '';
    console.log('--- Footer2.xml ---');
    console.log(footerXml);

    const docXml = zip.files['word/document.xml'].asText();

    // Search for 'alairas' in docXml that is NOT preceded by %
    // We will list all 'alairas' occurrences with context
    console.log('--- "alairas" Contexts in document.xml ---');
    const regex = /alairas/g;
    let match;
    while ((match = regex.exec(docXml)) !== null) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(docXml.length, match.index + 50);
        console.log(`...${docXml.substring(start, end)}...`);
    }

}

inspect().catch(console.error);
