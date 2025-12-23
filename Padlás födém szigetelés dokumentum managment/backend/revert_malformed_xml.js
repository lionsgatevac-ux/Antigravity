const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // The previous script added: ' <w:t>(azaz [[munkadijbetuvel]])</w:t>' or just the string depending on how I messed up.
    // I used: match + ' <w:t>(azaz [[munkadijbetuvel]])</w:t>' 
    // And match included ']]'.

    // So look for that exact string.
    const searchStr = '<w:t>(azaz [[munkadijbetuvel]])</w:t>';

    if (xml.includes(searchStr)) {
        console.log('Found inserted string. Removing it...');
        xml = xml.replace(searchStr, '');
        zip.file('word/document.xml', xml);
        fs.writeFileSync(templatePath, zip.generate({ type: 'nodebuffer' }));
        console.log('Reverted successfully.');
    } else {
        console.log('Specific insertion string not found. Trying simpler part...');
        if (xml.includes('(azaz [[munkadijbetuvel]])')) {
            console.log('Found just the text part. Removing...');
            xml = xml.replace('(azaz [[munkadijbetuvel]])', '');
            zip.file('word/document.xml', xml);
            fs.writeFileSync(templatePath, zip.generate({ type: 'nodebuffer' }));
            console.log('Reverted text part.');
        } else {
            console.log('Corruption string not found. Manual inspection needed?');
        }
    }

} catch (e) {
    console.error('Error:', e);
}
