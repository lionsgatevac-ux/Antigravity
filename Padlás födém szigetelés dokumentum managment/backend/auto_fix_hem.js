const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const documentGenerator = require('./services/documentGenerator');

const TEMPLATE_NAME = 'megallapodas_hem';
const TEMPLATE_PATH = path.join(__dirname, '../templates/megallapodas_hem.docx');
const TEST_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

console.log('=== HEM TEMPLATE COMPREHENSIVE DIAGNOSTIC ===\n');

// Step 1: Inspect template XML for ALL tag occurrences
function inspectTemplate() {
    console.log('STEP 1: Inspecting template XML...');
    const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    // Find ALL docxtemplater tags
    const tagMatches = xml.match(/\[\[[^\]]+\]\]/g) || [];
    console.log(`Found ${tagMatches.length} total tags in template`);

    // Specifically look for signature-related content
    const signatureTerms = ['alair', 'signature', 'ugyfel', 'kivitelez'];
    const issues = [];

    signatureTerms.forEach(term => {
        const regex = new RegExp(term, 'gi');
        let match;
        const positions = [];
        while ((match = regex.exec(xml)) !== null) {
            positions.push(match.index);
        }

        if (positions.length > 0) {
            console.log(`  - Found "${term}" at ${positions.length} positions`);
            positions.forEach(pos => {
                const context = xml.substring(Math.max(0, pos - 50), pos + 50);
                // Check if this is inside a tag
                const beforeTag = context.lastIndexOf('[[');
                const afterTag = context.indexOf(']]');
                if (beforeTag !== -1 && afterTag !== -1) {
                    const fullTag = context.substring(beforeTag, afterTag + 2);
                    // Check if it has % prefix
                    if (!fullTag.includes('%')) {
                        issues.push({
                            type: 'missing_percent',
                            term: term,
                            position: pos,
                            context: fullTag
                        });
                    }
                }
            });
        }
    });

    return { xml, zip, tagMatches, issues };
}

// Step 2: Auto-fix issues
function fixIssues(inspection) {
    if (inspection.issues.length === 0) {
        console.log('\nSTEP 2: No issues found - template looks good!');
        return null;
    }

    console.log(`\nSTEP 2: Found ${inspection.issues.length} issues, fixing...`);
    let xml = inspection.xml;

    inspection.issues.forEach(issue => {
        console.log(`  - Fixing: ${issue.type} for "${issue.term}"`);
        // Add % before signature tag names
        xml = xml.replace(/\[\[(\s*)(alairasugyfel|alairaskivitelezo)(\s*)\]\]/g, '[[%$2]]');
    });

    // Save fixed template
    const backup = TEMPLATE_PATH.replace('.docx', '_auto_backup.docx');
    fs.copyFileSync(TEMPLATE_PATH, backup);
    console.log(`  - Created backup: ${path.basename(backup)}`);

    inspection.zip.file('word/document.xml', xml);
    const buffer = inspection.zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(TEMPLATE_PATH, buffer);
    console.log(`  - Saved fixed template`);

    return true;
}

// Step 3: Test document generation
async function testGeneration() {
    console.log('\nSTEP 3: Testing document generation...');

    const mockData = {
        contract_number: 'TEST-AUTO-FIX-001',
        contract_date: new Date(),
        customer_name: 'Test Customer',
        customer_signature_data: TEST_IMAGE,
        contractor_signature_data: TEST_IMAGE,
        // Add minimal required fields
        hrsz: '1234',
        net_amount: 100000,
        labor_cost: 50000,
    };

    try {
        const result = await documentGenerator.generate(TEMPLATE_NAME, mockData);
        console.log(`  ✓ Generated: ${result.fileName}`);
        return result.filePath;
    } catch (error) {
        console.error(`  ✗ Generation failed: ${error.message}`);
        throw error;
    }
}

// Step 4: Verify output
function verifyOutput(filePath) {
    console.log('\nSTEP 4: Verifying generated document...');

    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.files['word/document.xml'].asText();

    const issues = [];

    // Check for raw Base64
    if (xml.includes('data:image/png;base64,')) {
        const count = (xml.match(/data:image\/png;base64,/g) || []).length;
        issues.push(`Contains ${count} raw Base64 string(s)`);
    }

    // Check for image tags
    const imageCount = (xml.match(/<w:drawing>/g) || []).length;
    console.log(`  - Found ${imageCount} images (<w:drawing> tags)`);

    if (imageCount < 2) {
        issues.push(`Only ${imageCount} images found (expected 2 signatures)`);
    }

    // Check for unreplaced tags
    const unreplaced = xml.match(/\[\[[^\]]+\]\]/g);
    if (unreplaced) {
        issues.push(`Unreplaced tags: ${unreplaced.join(', ')}`);
    }

    if (issues.length > 0) {
        console.log('\n  ✗ VERIFICATION FAILED:');
        issues.forEach(issue => console.log(`    - ${issue}`));
        return false;
    }

    console.log('\n  ✓ VERIFICATION PASSED: Document is clean!');
    return true;
}

// Main execution
(async () => {
    try {
        let attempt = 1;
        const MAX_ATTEMPTS = 3;

        while (attempt <= MAX_ATTEMPTS) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`ATTEMPT ${attempt}/${MAX_ATTEMPTS}`);
            console.log('='.repeat(60));

            // Inspect
            const inspection = inspectTemplate();

            // Fix if needed
            const fixed = fixIssues(inspection);

            // Test
            const generatedPath = await testGeneration();

            // Verify
            const passed = verifyOutput(generatedPath);

            if (passed) {
                console.log('\n' + '='.repeat(60));
                console.log('✓✓✓ SUCCESS! Document generation is working correctly! ✓✓✓');
                console.log('='.repeat(60));
                console.log(`\nTest file: ${generatedPath}`);
                console.log('You can now safely generate HEM documents from the UI.');
                process.exit(0);
            }

            if (attempt === MAX_ATTEMPTS) {
                console.log('\n' + '='.repeat(60));
                console.log('✗✗✗ FAILED after maximum attempts ✗✗✗');
                console.log('='.repeat(60));
                console.log('\nThe issue may require manual intervention.');
                console.log(`Latest test file: ${generatedPath}`);
                process.exit(1);
            }

            attempt++;
            console.log('\nRetrying with fixed template...');
        }

    } catch (error) {
        console.error('\n✗ FATAL ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
