
require('dotenv').config();
console.log('DEBUG: process.env.DATABASE_URL =', process.env.DATABASE_URL);

const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'bozso_db',
    password: 'Biznisz matek',
    port: 5432
});
const query = async (text, params) => pool.query(text, params);
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Mock response object
const res = {
    set: (headers) => console.log('Headers set:', headers),
    send: (content) => {
        console.log(`Sending content of size: ${content.length} bytes`);
        fs.writeFileSync('debug_export.zip', content);
        console.log('✅ ZIP saved to debug_export.zip');
    },
    status: (code) => ({
        json: (data) => console.log(`Status ${code}:`, data)
    })
};

// projectId will be fetched dynamically
let projectId = null;

async function getFileContent(filePath) {
    console.log(`[getFileContent] Fetching: ${filePath}`);
    if (!filePath) return null;

    // Remote URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`Failed to fetch remote file: ${filePath}, status: ${response.status}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            console.log(`[getFileContent] Success: ${arrayBuffer.byteLength} bytes`);
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error(`Error downloading remote file: ${filePath}`, error);
            return null;
        }
    }

    // Local file handling (mocked or tried)
    const absPath = path.resolve(process.cwd(), filePath);
    console.log(`[getFileContent] Trying local: ${absPath}`);
    // In this debug script on local machine, local cloud run paths won't exist.
    // We just return null/warn.
    return null;
}

async function runExport() {
    console.log(`Starting export debug for Project ID: ${projectId}...`);
    try {
        // 0. Get a valid project ID if not set
        if (!projectId) {
            console.log('Fetching first available project to debug...');
            const pRes = await query('SELECT id FROM projects LIMIT 1');
            if (pRes.rows.length === 0) {
                console.error('No projects found in DB to debug.');
                return;
            }
            projectId = pRes.rows[0].id;
            console.log(`Debug Target Project ID: ${projectId}`);
        }

        // 1. Fetch all data
        console.log('Fetching project data...');
        const projectResult = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
        const projectData = projectResult.rows[0];

        if (!projectData) {
            console.error('Project not found');
            return;
        }
        console.log('Project data loaded.');

        const photosResult = await query('SELECT * FROM photos WHERE project_id = $1', [projectId]);
        console.log(`Found ${photosResult.rows.length} photos.`);

        // Log URLs to see what we are dealing with
        photosResult.rows.forEach(p => console.log(`Photo: ${p.photo_type} -> ${p.file_path}`));

        const docsResult = await query('SELECT * FROM documents WHERE project_id = $1', [projectId]);
        console.log(`Found ${docsResult.rows.length} documents.`);

        const zip = new PizZip();

        // 2. Create Summary Text
        zip.file('projekt_adatlap.txt', 'Debug Summary Content');

        // 3. Add Photos
        const photosFolder = zip.folder('Fotok');
        for (const photo of photosResult.rows) {
            console.log(`Processing photo: ${photo.photo_type}`);
            try {
                const buffer = await getFileContent(photo.file_path);
                if (buffer) {
                    let ext = path.extname(photo.file_path);
                    if (!ext && photo.file_path.startsWith('http')) ext = '.png';
                    photosFolder.file(`image_${photo.id}${ext}`, buffer);
                } else {
                    console.warn(`SKIPPING photo due to fetch failure (buffer null): ${photo.file_path}`);
                    photosFolder.file(`MISSING_${photo.photo_type}_${photo.id}.txt`, `File unavailable: ${photo.file_path}`);
                }
            } catch (err) {
                console.error(`ERROR processing photo ${photo.id}:`, err);
                photosFolder.file(`ERROR_${photo.photo_type}_${photo.id}.txt`, err.message);
            }
        }

        // 4. Add Documents
        const docsFolder = zip.folder('Dokumentumok');
        for (const doc of docsResult.rows) {
            console.log(`Processing doc: ${doc.file_path}`);
            try {
                const buffer = await getFileContent(doc.file_path);
                if (buffer) {
                    const fileName = path.basename(doc.file_path);
                    docsFolder.file(fileName, buffer);
                } else {
                    console.warn(`SKIPPING doc due to fetch failure: ${doc.file_path}`);
                    docsFolder.file(`MISSING_DOC_${doc.id}.txt`, `File unavailable: ${doc.file_path}`);
                }
            } catch (err) {
                console.error(`ERROR processing doc ${doc.id}:`, err);
                docsFolder.file(`ERROR_DOC_${doc.id}.txt`, err.message);
            }
        }
        console.log('Generating ZIP...');
        const content = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

        res.send(content);

    } catch (error) {
        console.error('❌ EXPORT ERROR:', error);
    } finally {
        pool.end();
    }
}

runExport();
