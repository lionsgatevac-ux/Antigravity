const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase client
// Ensure SUPABASE_URL and SUPABASE_KEY are set in .env
const supabaseUrl = process.env.SUPABASE_URL || 'https://pkjohziwbiiyzyospuot.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Storage initialized');
} else {
    console.warn('⚠️ Supabase Storage NOT initialized. Missing SUPABASE_URL or SUPABASE_KEY.');
    console.warn('   File uploads will fail or fallback to local storage (if implemented).');
}

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file content
 * @param {string} mimeType - The file mime type (e.g. image/png)
 * @param {string} storagePath - The desired path in the bucket (e.g. floor_plan/project-id/filename.png)
 * @param {string} bucket - The bucket name (default: project-files)
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadFile(fileBuffer, mimeType, storagePath, bucket = 'project-files') {
    if (!supabase) {
        throw new Error('Supabase Storage is not configured.');
    }

    console.log(`[Storage] Uploading to ${bucket}/${storagePath}...`);

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: true
        });

    if (error) {
        console.error('[Storage] Upload error:', error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);

    console.log(`[Storage] Upload success: ${publicUrl}`);
    return publicUrl;
}

module.exports = {
    uploadFile,
    supabase
};
