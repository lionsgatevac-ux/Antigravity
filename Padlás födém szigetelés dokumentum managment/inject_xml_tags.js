const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const filePath = path.join(__dirname, 'templates', 'kivitelezoi_nyilatkozat.docx');
const outputPath = filePath; // Overwrite

try {
    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    let xml = zip.file('word/document.xml').asText();

    console.log(`Original XML length: ${xml.length}`);

    // Define the XML to inject
    // Using generic pPr/rPr to match surrounding style roughly
    const newXml = `
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>Nyilatkozom a padlásfeljáró szigeteléséről:</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>[[padlasfeljaro_szigetelese_igen]] A padlásfeljáró ajtó szigetelve lett.</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>[[padlasfeljaro_szigetelese_nem]] A padlásfeljáró ajtó NEM lett szigetelve.</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>Padlásfödémen kívül szigetelésre került:</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>[[pf_kivul_fodemen]] Padlásfödém</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>[[pf_kivul_oromfal]] Oromfal</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>[[pf_kivul_bonthato]] Bontható</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>[[pf_kivul_egyeb]] Egyéb: [[pf_kivul_egyeb_szoveg]]</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t></w:t></w:r></w:p>
`;

    // Find the paragraph containing "Kelt.:"
    // Regex explanation:
    // <w:p [^>]*> : Match paragraph start tag with any attributes
    // (?!<w:p) : Negative lookahead ensuring we don't match partial tags? No, simpler.
    // We search for the occurrence of "Kelt.:" inside text tags, then find the preceding <w:p calling match.

    // Simpler string search approach
    // We assume standard word XML structure where <w:p> tags are top level children of body (mostly)

    // Find index of "Kelt.:"
    const keltIndex = xml.indexOf('Kelt.:');
    if (keltIndex === -1) {
        throw new Error('Could not find "Kelt.:" anchor in document.xml');
    }

    // Find the start of the paragraph containing "Kelt.:" by looking backwards from keltIndex
    const pStartIndex = xml.lastIndexOf('<w:p ', keltIndex);
    if (pStartIndex === -1) {
        throw new Error('Could not find paragraph start for "Kelt.:"');
    }

    // Also check for simple <w:p> without attributes if necessary (though usually they have IDs)
    const pStartSimple = xml.lastIndexOf('<w:p>', keltIndex);
    const finalStartIndex = Math.max(pStartIndex, pStartSimple);

    console.log(`Found insertion point at index: ${finalStartIndex}`);
    console.log(`Context: ${xml.substring(finalStartIndex, finalStartIndex + 100)}...`);

    // Insert new XML
    const modifiedXml = xml.slice(0, finalStartIndex) + newXml + xml.slice(finalStartIndex);

    console.log(`New XML length: ${modifiedXml.length}`);

    // Update zip
    zip.file('word/document.xml', modifiedXml);

    // Save
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(outputPath, buffer);

    console.log('✅ Successfully injected XML tags into docx!');

} catch (err) {
    console.error('❌ Error injecting tags:', err);
    process.exit(1);
}
