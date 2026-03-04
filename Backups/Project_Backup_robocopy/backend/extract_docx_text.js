const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const DOMParser = require('@xmldom/xmldom').DOMParser;

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new DOMParser().parseFromString(zip.files['word/document.xml'].asText(), 'text/xml');

    // Extract text recursively
    function getText(node) {
        let text = '';
        if (node.nodeName === 'w:t') {
            text += node.textContent;
        }
        if (node.nodeName === 'w:p') {
            text += '\n'; // New paragraph
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                text += getText(node.childNodes[i]);
            }
        }
        return text;
    }

    console.log(getText(doc));
} catch (e) {
    console.error(e);
}
