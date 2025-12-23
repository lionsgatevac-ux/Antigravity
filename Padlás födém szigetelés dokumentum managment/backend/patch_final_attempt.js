const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('--- Checking for szamoltosszeg ---');

    if (xml.includes('[[szamoltosszeg]]')) {
        console.log('Found [[szamoltosszeg]]. Patching...');
        xml = xml.replace(/\[\[szamoltosszeg\]\]/g, '[[szamoltosszeg]] (azaz [[szamoltosszegbetuvel]])');
        zip.file('word/document.xml', xml);
        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log('Template patched: [[szamoltosszeg]] -> [[szamoltosszeg]] (azaz [[szamoltosszegbetuvel]])');
    } else {
        console.log('[[szamoltosszeg]] NOT found.');

        // Desperate debug: print all tags again but better
        const matches = xml.match(/\[\[(.*?)\]\]/g);
        if (matches) {
            console.log('Tags found:');
            matches.forEach(m => console.log(m));
        }
    }

} catch (e) {
    console.error('Error:', e);
}
