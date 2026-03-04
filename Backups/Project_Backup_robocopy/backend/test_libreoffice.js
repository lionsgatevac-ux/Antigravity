const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

async function testLibreOffice() {
    console.log('🔍 Testing LibreOffice Installation...\n');

    try {
        // 1. Check if LibreOffice is installed
        console.log('1️⃣ Checking LibreOffice version...');
        try {
            const { stdout: versionOutput } = await execPromise('libreoffice --version');
            console.log(`   ✅ LibreOffice found: ${versionOutput.trim()}`);
        } catch (error) {
            console.error('   ❌ LibreOffice NOT found!');
            console.error('   Error:', error.message);
            throw new Error('LibreOffice is not installed');
        }

        // 2. Check soffice binary
        console.log('\n2️⃣ Checking soffice binary...');
        try {
            const { stdout: sofficeOutput } = await execPromise('which soffice || where soffice');
            console.log(`   ✅ soffice binary: ${sofficeOutput.trim()}`);
        } catch (error) {
            console.warn('   ⚠️ soffice binary location not found via which/where');
        }

        // 3. Test DOCX to PDF conversion
        console.log('\n3️⃣ Testing DOCX to PDF conversion...');

        const testDir = path.join(__dirname, 'test_libreoffice');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create a simple test DOCX file (we'll use an existing template)
        const templatePath = path.join(__dirname, '..', 'templates', 'kivitelezesi_szerzodes_template.docx');
        const testDocxPath = path.join(testDir, 'test_document.docx');

        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, testDocxPath);
            console.log(`   📄 Test DOCX created: ${testDocxPath}`);

            // Try to convert to PDF
            const outputDir = testDir;
            const convertCmd = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${testDocxPath}"`;

            console.log(`   🔄 Running conversion: ${convertCmd}`);

            try {
                const { stdout, stderr } = await execPromise(convertCmd, { timeout: 30000 });

                if (stdout) console.log(`   Output: ${stdout}`);
                if (stderr) console.warn(`   Stderr: ${stderr}`);

                const pdfPath = path.join(testDir, 'test_document.pdf');

                if (fs.existsSync(pdfPath)) {
                    const stats = fs.statSync(pdfPath);
                    console.log(`   ✅ PDF created successfully! Size: ${(stats.size / 1024).toFixed(2)} KB`);
                    console.log(`   📄 PDF path: ${pdfPath}`);
                } else {
                    console.error('   ❌ PDF file was not created!');
                    throw new Error('PDF conversion failed - file not found');
                }

            } catch (convError) {
                console.error('   ❌ Conversion failed!');
                console.error('   Error:', convError.message);
                throw convError;
            }

        } else {
            console.warn(`   ⚠️ Template not found at ${templatePath}`);
            console.warn('   Skipping conversion test');
        }

        console.log('\n✅ LibreOffice test PASSED!');
        console.log('🎉 LibreOffice is properly installed and functional\n');

        return true;

    } catch (error) {
        console.error('\n❌ LibreOffice test FAILED!');
        console.error('Error:', error.message);
        console.error('\n💡 LibreOffice needs to be installed in the Docker container!');
        return false;
    }
}

// Run test
testLibreOffice()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Test execution error:', err);
        process.exit(1);
    });
