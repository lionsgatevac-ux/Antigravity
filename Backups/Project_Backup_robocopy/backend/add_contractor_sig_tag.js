const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');
const backupPath = path.join(__dirname, '../templates/megallapodas_hem_before_contractor_fix.docx');

try {
    // Backup first
    fs.copyFileSync(templatePath, backupPath);
    console.log('Created backup');

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    let xml = zip.files['word/document.xml'].asText();

    // Find the customer signature tag to use as reference
    const customerSigIdx = xml.indexOf('%alairasugyfel');
    if (customerSigIdx === -1) {
        console.error('ERROR: Could not find customer signature tag!');
        process.exit(1);
    }

    console.log(`Found customer sig at ${customerSigIdx}`);

    // Strategy: Insert contractor signature AFTER customer signature
    // Find the end of the customer signature paragraph
    const afterCustomerSig = xml.indexOf('</w:p>', customerSigIdx);

    if (afterCustomerSig === -1) {
        console.error('ERROR: Could not find paragraph end after customer sig!');
        process.exit(1);
    }

    // Create a new paragraph for contractor signature (copy structure from customer)
    // Extract the paragraph containing customer sig as template
    const paraStart = xml.lastIndexOf('<w:p ', afterCustomerSig);
    const paraEnd = afterCustomerSig + 6; // '</w:p>'.length
    const customerParaStructure = xml.substring(paraStart, paraEnd);

    // Replace %alairasugyfel with %alairaskivitelezo in the copied structure
    const contractorPara = customerParaStructure.replace(/%alairasugyfel/g, '%alairaskivitelezo');

    // Insert the new paragraph right after customer signature paragraph
    const insertPoint = paraEnd;
    xml = xml.slice(0, insertPoint) + '\n' + contractorPara + xml.slice(insertPoint);

    console.log('Inserted contractor signature tag');

    // Save
    zip.file('word/document.xml', xml);
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, buffer);

    console.log('SUCCESS: Added contractor signature tag to template');

} catch (e) {
    console.error('FATAL ERROR:', e);
    process.exit(1);
}
