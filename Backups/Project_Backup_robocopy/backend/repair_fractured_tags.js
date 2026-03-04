const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/kivitelezesi_szerzodes.docx');

function cleanXmlTags(str) {
    return str.replace(/<[^>]+>/g, '');
}

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    let xml = zip.files['word/document.xml'].asText();
    let originalLength = xml.length;

    console.log('--- XML REPAIR START ---');

    // Regex to find [[ ... ]]
    // We want to match [[ then anything until ]]
    // But we need to handle the case where tags are split like:
    // <w:t>[[</w:t> ... <w:t>var</w:t> ... <w:t>]]</w:t>

    // Step 1: Find all occurrences of [[
    // Step 2: For each, find the closing ]]
    // Step 3: Extract content, strip tags, check if variable
    // Step 4: Replace

    // Since we can't easily do balanced matching with simple Regex in JS perfectly for XML,
    // we will rely on the fact that `[[` and `]]` shouldn't appear in tags.

    const parts = xml.split('[[');
    let newXml = parts[0];
    let repairs = 0;

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const closingIndex = part.indexOf(']]');

        if (closingIndex !== -1) {
            // We found a closing bracket.
            const contentWithTags = part.substring(0, closingIndex);
            const remaining = part.substring(closingIndex + 2);

            // Extract the variable name by cleaning tags
            const cleanContent = cleanXmlTags(contentWithTags).trim();

            // Heuristic: If clean content is short (variable name), we repair it.
            // If it's very long, it might be text content that naturally has brackets? (Unlikely)
            // Or if it contains spaces? Variables usually don't have spaces, but maybe expressions?
            // "alairasugyfel"

            if (cleanContent.length > 0 && cleanContent.length < 50) {
                // REPAIR:
                // We reconstructed the previous part ending with [[
                // Now we append just the clean variable, then ]]
                // BUT: The XML structure might be broken if we simply strip tags.
                // "Text start <tag>[[</tag> variable <tag>]]</tag> Text end"
                // If we replace inner with "variable", we get: "Text start <tag>variable Text end" ?? 
                // No, we are in `part` which starts AFTER `[[`.

                // The split approach is dangerous because `[[` might be inside a tag value? Unlikely.

                // Better regex approach:
                // Match `\[\[((?:(?!\]\]).)*)\]\]`
                // Then replace with `[[clean($1)]]`

                // However, we must ensure we are not destroying XML tags that span across?
                // If `[[` is in one paragraph and `]]` in another... Docxtemplater doesn't support that anyway.

            }
        }
    }

    // Regex approach is safer for "in-paragraph" tags which is 99% of cases.
    // Match `\[\[` followed by any chars that are NOT `]]`, then `]]`
    const diffRegex = /\[\[((?:(?!\]\]).)+?)\]\]/g;

    let repairedXml = xml.replace(diffRegex, (match, inner) => {
        const cleaned = cleanXmlTags(inner).trim();
        if (cleaned !== inner && cleaned.length < 50) {
            console.log(`Repaired: ${match} -> [[${cleaned}]]`);
            repairs++;
            return `[[${cleaned}]]`; // This puts the CLEAN text into the XML text node.
            // CAUTION: If the original match spanned multiple <w:t> tags, replacing it with a single string
            // inside existing XML structure might result in invalid XML if we broke a tag?
            // e.g. `<w:t>[[</w:t><w:t>var</w:t><w:t>]]</w:t>`
            // The match is `[[</w:t><w:t>var</w:t><w:t>]]`
            // Replaced with `[[var]]`
            // Result surrounding context: `...<w:t>[[var]]</w:t>...`?
            // No, the <w:t> tags were PART of the match, so they get REMOVED.
            // So we might remove closing/opening tags and break validity.

            // Example: `<w:r><w:t>[[</w:t></w:r> <w:r><w:t>var</w:t></w:r> <w:r><w:t>]]</w:t></w:r>`
            // If I verify I am NOT removing structural tags like <w:p>, <w:tc>?
            // Usually it's just <w:r>, <w:t>, <w:proofErr>.

            // Strategy: Only repair if the inner tags are "inline" text formatting tags.
            // If it contains </w:p>, we abort.
            if (inner.includes('w:p') || inner.includes('w:tc')) {
                console.log(`Skipping complex tag: ${cleaned}`);
                return match;
            }
            return `[[${cleaned}]]`;
        }
        return match;
    });

    if (repairs > 0) {
        zip.file('word/document.xml', repairedXml);
        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, buffer);
        console.log(`Repair complete. Fixed ${repairs} fractured tags.`);
    } else {
        console.log('No fractured tags found (or regex failed).');
    }

} catch (e) {
    console.error('Error:', e);
}
