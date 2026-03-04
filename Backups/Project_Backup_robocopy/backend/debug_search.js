const fs = require('fs');
const PizZip = require('pizzip');

try {
    const content = fs.readFileSync('../templates/kivitelezesi_szerzodes.docx');
    const zip = new PizZip(content);
    const text = zip.files['word/document.xml'].asText();

    // Look for a long sequence of dots which likely represents the signature line
    const dotRegex = /[.\u2026]{20,}/g;
    let match;
    let found = false;

    while ((match = dotRegex.exec(text)) !== null) {
        console.log(`Found dots at index ${match.index}`);
        // Save context
        const start = Math.max(0, match.index - 200);
        const end = Math.min(text.length, match.index + 500);
        const context = text.substring(start, end);

        // Check if "Végfelhasználó" is in the context
        if (context.includes('Végfelhasználó')) {
            console.log('Found signature context!');
            fs.writeFileSync('debug_dots.txt', context);
            found = true;
            break;
        }
    }

    if (!found) {
        console.log('No signature dots found with Végfelhasználó context.');
        // Fallback: Just save the last one found
        // or search for "Végfelhasználó" and save around it
        const index = text.indexOf('Végfelhasználó');
        if (index !== -1) {
            const start = Math.max(0, index - 200);
            const end = Math.min(text.length, index + 500);
            fs.writeFileSync('debug_dots.txt', text.substring(start, end));
        }
    }

} catch (e) {
    console.error(e);
}
