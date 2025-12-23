const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatesToFix = [
    'kivitelezesi_szerzodes.docx',
    'atadas_atveteli.docx',
    'megallapodas_hem.docx',
    'kivitelezoi_nyilatkozat.docx'
];

templatesToFix.forEach(filename => {
    const templatePath = path.join(__dirname, '../templates', filename);
    const backupPath = path.join(__dirname, '../templates', `${filename.replace('.docx', '')}_backup.docx`);

    try {
        console.log(`\nProcessing template: ${filename}`);
        if (!fs.existsSync(templatePath)) {
            console.log(`File not found: ${templatePath}`);
            return;
        }

        const content = fs.readFileSync(templatePath, 'binary');

        // Create backup
        fs.writeFileSync(backupPath, content, 'binary');
        console.log(`Backup created at: ${backupPath}`);

        const zip = new PizZip(content);
        let xml = zip.files['word/document.xml'].asText();
        let repairs = 0;

        // Tags to fix: We look for [[tag]] where tag is one of our image fields, AND it doesn't have %
        const imageTags = ['alairasugyfel', 'alairaskivitelezo', 'alaprajz'];

        imageTags.forEach(tagName => {
            // Regex looks for [[tagName]] but NOT [[%tagName]]
            // Handle optional whitespace: [[  tagName  ]]
            const regex = new RegExp(`\\[\\[\\s*${tagName}\\s*\\]\\]`, 'g');

            if (regex.test(xml)) {
                console.log(`Found incorrect tag: [[${tagName}]]`);
                // Replace with [[%tagName]]
                xml = xml.replace(regex, `[[%${tagName}]]`);
                repairs++;
                console.log(`Fixed to: [[%${tagName}]]`);
            } else {
                // Check if it's already correct to avoid false alarm
                const correctRegex = new RegExp(`\\[\\[\\s*%${tagName}\\s*\\]\\]`, 'g');
                if (correctRegex.test(xml)) {
                    console.log(`Tag [[%${tagName}]] is already correct.`);
                } else {
                    console.log(`Tag [[${tagName}]] not found (neither correct nor incorrect).`);
                }
            }
        });

        if (repairs > 0) {
            zip.file('word/document.xml', xml);
            const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(templatePath, buffer);
            console.log(`Repair complete. Fixed ${repairs} tags.`);
        } else {
            console.log('No incorrect image tags found in this file.');
        }

    } catch (e) {
        console.error(`Error processing ${filename}:`, e);
    }
});
