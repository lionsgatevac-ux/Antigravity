const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Fallback config if .env is missing/broken (same as debug_zip_export.js)
const poolConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'bozso_db',
    password: 'Biznisz matek',
    port: 5432,
};

const pool = new Pool(poolConfig);

async function cleanup() {
    try {
        console.log('Starting cleanup of invalid local paths...');

        // 1. Clean Photos
        const photosRes = await pool.query("SELECT id, project_id, file_path, photo_type FROM photos WHERE file_path NOT LIKE 'http%'");
        console.log(`Checking ${photosRes.rowCount} local photos...`);

        let deletedPhotos = 0;
        for (const photo of photosRes.rows) {
            // Check if file exists relative to backend root? Or absolute?
            // Usually paths are stored relative or absolute.
            // Let's try to resolve.
            let exists = false;
            if (fs.existsSync(photo.file_path)) {
                exists = true;
            } else {
                const absPath = path.resolve(process.cwd(), photo.file_path);
                if (fs.existsSync(absPath)) exists = true;
            }

            if (!exists) {
                console.log(`❌ Missing Photo [${photo.id}]: ${photo.file_path} (Type: ${photo.photo_type})`);
                await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
                deletedPhotos++;
            }
        }
        console.log(`Deleted ${deletedPhotos} invalid photo entries.`);

        // 2. Clean Documents
        const docsRes = await pool.query("SELECT id, project_id, file_path, document_type FROM documents WHERE file_path NOT LIKE 'http%'");
        console.log(`Checking ${docsRes.rowCount} local documents...`);

        let deletedDocs = 0;
        for (const doc of docsRes.rows) {
            let exists = false;
            if (fs.existsSync(doc.file_path)) {
                exists = true;
            } else {
                const absPath = path.resolve(process.cwd(), doc.file_path);
                if (fs.existsSync(absPath)) exists = true;
            }

            if (!exists) {
                console.log(`❌ Missing Document [${doc.id}]: ${doc.file_path}`);
                await pool.query('DELETE FROM documents WHERE id = $1', [doc.id]);
                deletedDocs++;
            }
        }
        console.log(`Deleted ${deletedDocs} invalid document entries.`);

    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        await pool.end();
    }
}

cleanup();
