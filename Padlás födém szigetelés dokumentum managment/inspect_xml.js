const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const filePath = path.join(__dirname, 'templates', 'megallapodas_hem.docx');

try {
    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    const xml = zip.file('word/document.xml').asText();

    console.log(`--- Analyzing ${filePath} ---`);

    // Find all occurrences of 'alairas'
    const keyword = 'alairas';
    let index = xml.indexOf(keyword);

    if (index === -1) {
        console.log(`Keyword "${keyword}" NOT FOUND in XML!`);
    }

    // Check for split tags using a regex that allows for XML tags in between
    // Regex: \[\[ (<[^>]+>)* alairas (<[^>]+>)* \]\]
    // Javascript regex doesn't support recursive checking well, but we can approximate:
    // \[\[ (?:<[^>]+>)*? alairas (?:<[^>]+>)*? \]\]

    // BUT we also need to check if the tag is simply missing the %

    // Let's print any occurrence of [[ that is followed by alairas within 100 chars
    const openBracketIndex = xml.indexOf('[[');
    if (openBracketIndex !== -1) {
        console.log('\n--- Checking Brackets ---');
        let current = openBracketIndex;
        while (current !== -1) {
            const snippet = xml.substring(current, Math.min(xml.length, current + 200));
            if (snippet.includes('alairas') || snippet.includes('belyegzo')) {
                console.log(`Potential Split Tag at ${current}:`);
                console.log(snippet);
            }
            current = xml.indexOf('[[', current + 1);
        }
    }

    while (index !== -1) {
        // Grab context: 100 chars before and after
        const start = Math.max(0, index - 100);
        const end = Math.min(xml.length, index + 100);
        const snippet = xml.substring(start, end);

        console.log(`\n--- Match at index ${index} ---`);
        console.log(snippet);

        index = xml.indexOf(keyword, index + 1);
    }

    // Also check for 'alairas' inside split tags?
    // The simple indexOf might fail if 'ala' and 'iras' are split, but usually it's the [[ and ]] that are split from the keyword.

    console.log('\n--- Checking for split tags around keys ---');
    // We look for patterns where [[ is followed by tags then keyword

} catch (e) {
    console.error(e);
}
