const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();

    console.log('Original XML length:', xml.length);

    // Regex to find fractured tags: [[...]] where ... contains XML tags
    // We look for [[ followed by anything until ]]
    // But we need to be careful not to match nested stuff (unlikely in docxtemplater)

    // We will target specific variables we know are problematic to be safe
    const targetVars = ['munkadij', 'szerzodesi_osszeg', 'szamoltosszeg'];

    let changed = false;

    for (const v of targetVars) {
        // Regex: matches [[ (possibly with xml tags in between) variable (possibly with xml tags) ]] (xml tags)
        // Hard to do perfect regex for arbitrary XML.
        // But commonly it is: <w:t>[[</w:t> ... <w:t>var</w:t> ... <w:t>]]</w:t>

        // Simpler approach: Remove all XML tags, if it equals [[var]], then find that sequence in XML? No.

        // Let's try to just find the variable name in the XML and assert if it isn't surrounded by clean brackets.

        // Actually, if we just find the sequence of characters for the variable, and checking if predecessors are brackets with junk.

        // Let's use a very aggressive normalizer for the specific labor cost area.
        // We know it ends with "Ft".

    }

    // Alternative: The user says "munkadíjat nem irja ki".
    // I will try to find "munkadíjat" text and see what's after.
    // Wait, the document says "Munkadíj: [[...]] Ft".

    // I will search for "Munkadíj" context again but with the knowledge that tags are split.
    // XML: Munkad<w:t>íj</w:t>...

    // BRUTE FORCE PATCH:
    // I will search for the specific corrupted sequence for 'szamoltosszeg' if I can guess it.
    // '[[szamoltosszeg]]' might be:
    // <w:t>[[</w:t><w:proofErr .../><w:t>szamoltosszeg</w:t>...

    // Let's just try to replace `szamoltosszeg` with `szamoltosszeg]] (azaz [[szamoltosszegbetuvel`
    // WITHOUT the leading brackets in the replacement, assuming they exist.
    // But if I add `]]` and it already has `]]`, I get `]]]]`.

    // BETTER PLAN:
    // Search for `szamoltosszeg` literal.
    // If found, append ` (azaz [[szamoltosszegbetuvel]])` AFTER the closing bracket behavior.

    // Let's try to just run the normalize regex:
    // Replace: \[\[(<[^>]*>)*szamoltosszeg(<[^>]*>)*\]\]
    // With: [[szamoltosszeg]]

    const regex = /\[\[(?:<[^>]*>)*szamoltosszeg(?:<[^>]*>)*\]\]/g;

    if (regex.test(xml)) {
        console.log('Found fractured [[szamoltosszeg]]! Normalizing...');
        xml = xml.replace(regex, '[[szamoltosszeg]]');
        changed = true;
    }

    const regex2 = /\[\[(?:<[^>]*>)*szerzodesi_osszeg(?:<[^>]*>)*\]\]/g;
    if (regex2.test(xml)) {
        console.log('Found fractured [[szerzodesi_osszeg]]! Normalizing...');
        xml = xml.replace(regex2, '[[szerzodesi_osszeg]]');
        changed = true;
    }

    const regex3 = /\[\[(?:<[^>]*>)*munkadij(?:<[^>]*>)*\]\]/g;
    if (regex3.test(xml)) {
        console.log('Found fractured [[munkadij]]! Normalizing...');
        xml = xml.replace(regex3, '[[munkadij]]');
        changed = true;
    }

    if (changed) {
        zip.file('word/document.xml', xml);

        // NOW apply the patch safely since tags are clean
        let xml2 = zip.files['word/document.xml'].asText();
        if (xml2.includes('[[szamoltosszeg]]')) {
            xml2 = xml2.replace('[[szamoltosszeg]]', '[[szamoltosszeg]] (azaz [[szamoltosszegbetuvel]])');
            console.log('Applied patch to [[szamoltosszeg]]');
        }
        if (xml2.includes('[[munkadij]]')) {
            xml2 = xml2.replace('[[munkadij]]', '[[munkadij]] (azaz [[munkadijbetuvel]])');
            console.log('Applied patch to [[munkadij]]');
        }

        zip.file('word/document.xml', xml2);

        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log('Template normalized and patched!');
    } else {
        console.log('No fractured tags matched the regex. Complex fragmentation?');
    }

} catch (e) {
    console.error('Error:', e);
}
