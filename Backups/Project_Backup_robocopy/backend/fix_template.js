const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

if (!fs.existsSync(templatePath)) {
    console.error('Template not found!');
    process.exit(1);
}

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

let docXml = zip.files['word/document.xml'].asText();

console.log('Original length:', docXml.length);

// 1. Contract Number & Year (Preserve previous fixes)
if (docXml.includes('száma:……….')) {
    docXml = docXml.replace('száma:……….', 'száma: [[szerzodesszama]]');
    console.log('Replaced contract number (dots).');
} else if (docXml.includes('száma: [[szerzodesszama]]')) {
    console.log('Contract number already patched.');
} else {
    docXml = docXml.replace(/(>száma:)[.\u2026]{3,}(<)/g, '$1 [[szerzodesszama]]$2');
    console.log('Attemped regex for contract number.');
}

if (docXml.includes('[[ev]]')) {
    console.log('Year already patched.');
} else {
    const yearRegex = /(<w:t>)[\.\u2026]{3,}(<\/w:t>)(.*?<w:t>\.év<\/w:t>)/;
    if (yearRegex.test(docXml)) {
        docXml = docXml.replace(yearRegex, '$1[[ev]]$2$3');
        console.log('Replaced year variable.');
    }
}

// 2. Signature Variable Injection
// We search for "<w:t>mint</w:t>" which begins the "mint Ügyfél..." line.
// We want to insert [[%alairasugyfel]] before it.
// To handle the "dots" issue, we'll assume the dots are non-text (borders/graphics) or were in the empty paragraph.
// We will simply force the variable to appear above "mint".

const mintTag = '<w:t>mint</w:t>';
const mintReplacement = '<w:t>[[%alairasugyfel]]</w:t><w:br/><w:t>mint</w:t>';

if (docXml.includes(mintTag)) {
    // Only replace the instance that relates to Ugyfel (there might be others?)
    // The snippet showed: ...<w:t>mint</w:t></w:r><w:r>...<w:t xml:space="preserve"> Ügyfél vagy Megrendelő...
    // We can be more specific.
    const specificRegex = /(<w:t>mint<\/w:t>)(<\/w:r><w:r>.*?<w:t xml:space="preserve"> Ügyfél vagy Megrendelő)/;
    if (specificRegex.test(docXml)) {
        docXml = docXml.replace(specificRegex, '<w:t>[[%alairasugyfel]]</w:t><w:br/>$1$2');
        console.log('Injected signature variable [[%alairasugyfel]] before "mint Ügyfél..."');
    } else {
        // Fallback: replace any "mint" that looks like separate word
        // Dangerous if there are other "mint"s.
        // Let's print context if regex failed.
        console.log('Specific context for signature insertion not matched. Dumping "mint" contexts:');
        const mintIndices = [];
        let pos = docXml.indexOf('mint');
        while (pos !== -1) {
            console.log(docXml.substring(pos - 20, pos + 50));
            pos = docXml.indexOf('mint', pos + 1);
        }
    }
} else {
    console.log('Could not find "<w:t>mint</w:t>" tag.');
}

zip.file('word/document.xml', docXml);

const buffer = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(templatePath, buffer);

console.log('Template updated successfully!');
