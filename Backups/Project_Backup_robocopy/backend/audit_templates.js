const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatesDir = path.join(__dirname, '..', 'templates');

function extractVariables(content) {
    const regex = /\[\[(.*?)\]\]/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
        matches.add(match[1]);
    }
    return Array.from(matches);
}

function processTemplates() {
    if (!fs.existsSync(templatesDir)) {
        console.error('Templates directory not found!');
        return;
    }

    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));
    const results = {};

    files.forEach(file => {
        try {
            const content = fs.readFileSync(path.join(templatesDir, file), 'binary');
            const zip = new PizZip(content);
            const docXml = zip.file('word/document.xml').asText();
            const variables = extractVariables(docXml);
            results[file] = variables;
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    });

    fs.writeFileSync('audit_output.json', JSON.stringify(results, null, 2));
    console.log('Audit complete. Results written to audit_output.json');
}

processTemplates();
