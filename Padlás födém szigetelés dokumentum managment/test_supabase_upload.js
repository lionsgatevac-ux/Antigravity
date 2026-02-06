const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { uploadFile } = require('./backend/services/supabaseStorage');

async function testUpload() {
    try {
        console.log('🚀 Testing Supabase Upload...');
        const buffer = Buffer.from('TEST FILE CONTENT ' + Date.now());
        const projectId = 'test-project-' + Date.now();
        const path = `debug/${projectId}/test.txt`;

        console.log('Attempting upload to:', path);
        const url = await uploadFile(buffer, 'text/plain', path);
        console.log('✅ Upload successful! URL:', url);
    } catch (err) {
        console.error('❌ Upload failed:', err.message);
        console.error(err);
    }
}

testUpload();
