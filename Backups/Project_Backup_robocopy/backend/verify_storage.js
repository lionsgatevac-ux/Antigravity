require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verify() {
    console.log('--- Supabase Storage Verification ---');

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
        process.exit(1);
    }
    console.log('✅ Found API keys');

    const supabase = createClient(url, key);

    try {
        console.log('Testing upload to "project-files"...');
        const fileName = `test-upload-${Date.now()}.txt`;
        const { data, error } = await supabase.storage
            .from('project-files')
            .upload(`verification/${fileName}`, 'Supabase Storage Works!', {
                contentType: 'text/plain',
                upsert: true
            });

        if (error) {
            console.error('❌ Upload failed:', error);
            process.exit(1);
        }

        console.log('✅ Upload successful!');

        const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(`verification/${fileName}`);

        console.log('✅ Public URL generated:', publicUrl);
        console.log('--- Verification Passed ---');
        process.exit(0);

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

verify();
