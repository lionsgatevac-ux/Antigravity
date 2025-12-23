const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.docx'));

const tagsToSearch = [
    'alaprajz',
    'parazarofolia',
    'paraateresztofolia',
    'szigeteles',
    'insulation_type',
    'vapor_barrier_type',
    'breathable_membrane_type'
];

function cleanXmlTags(str) {
    return str.replace(/<[^>]+>/g, '');
}

const auditResults = {};

files.forEach(file => {
    const filePath = path.join(templatesDir, file);
    try {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);
        const text = zip.files['word/document.xml'].asText();

        auditResults[file] = {};

        tagsToSearch.forEach(tag => {
            // Check literal
            const literalTag = `[[${tag}]]`;
            const hasLiteral = text.includes(literalTag);

            // Check fractured
            const parts = tag.split('');
            const regexStr = parts.join('.*?'); // match each char with anything in between
            const fracturedRegex = new RegExp(`\\[\\[.*${regexStr}.*\\]\\]`);
            const fracturedMatch = text.match(fracturedRegex);

            if (hasLiteral) {
                auditResults[file][tag] = '✅ Clean';
            } else if (fracturedMatch) {
                auditResults[file][tag] = '⚠️ Fractured: ' + fracturedMatch[0].substring(0, 100);
            } else {
                auditResults[file][tag] = '❌ Missing';
            }
        });
    } catch (e) {
        auditResults[file] = { error: e.message };
    }
});

fs.writeFileSync('audit_templates_v2.json', JSON.stringify(auditResults, null, 2));
console.log('Audit complete. Results in audit_templates_v2.json');
