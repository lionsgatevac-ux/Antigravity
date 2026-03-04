const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { query } = require('../config/database');
const { uploadFile } = require('../services/supabaseStorage');
const path = require('path');

// POST upload photo
router.post('/photo', upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const { projectId, photoType } = req.body;
        const type = photoType || 'general';

        // Upload to Supabase
        // Path: photo_type/project_id/filename
        const ext = path.extname(req.file.originalname);
        const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1E6)}${ext}`;
        const storagePath = `${type}/${projectId}/${filename}`;

        let publicUrl;
        try {
            console.log(`Uploading file to Supabase: ${storagePath}`);
            publicUrl = await uploadFile(req.file.buffer, req.file.mimetype, storagePath);

            if (!publicUrl || !publicUrl.startsWith('http')) {
                throw new Error(`Invalid Supabase URL returned: ${publicUrl}`);
            }
            console.log(`Upload successful, URL: ${publicUrl}`);
        } catch (uploadError) {
            console.error('Supabase upload failed:', uploadError);
            throw uploadError;
        }

        // Save photo record to database
        const result = await query(
            `INSERT INTO photos (project_id, photo_type, file_path, file_url, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                projectId,
                type,
                publicUrl, // Store URL as file_path too, or keep it distinct? Using publicUrl is safer.
                publicUrl,
                JSON.stringify({
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    storage: 'supabase'
                })
            ]
        );

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                url: result.rows[0].file_url,
                fileName: filename
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST bulk upload photos
router.post('/photos/bulk', upload.array('photos', 20), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const { projectId, photoType } = req.body;
        const type = photoType || 'general';
        const uploadedPhotos = [];

        for (const file of req.files) {
            const ext = path.extname(file.originalname);
            const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1E6)}${ext}`;
            const storagePath = `${type}/${projectId}/${filename}`;

            const publicUrl = await uploadFile(file.buffer, file.mimetype, storagePath);

            if (!publicUrl || !publicUrl.startsWith('http')) {
                throw new Error(`Invalid Supabase URL returned for file ${file.originalname}: ${publicUrl}`);
            }

            const result = await query(
                `INSERT INTO photos (project_id, photo_type, file_path, file_url, metadata)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [
                    projectId,
                    type,
                    publicUrl,
                    publicUrl,
                    JSON.stringify({
                        originalName: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype,
                        storage: 'supabase'
                    })
                ]
            );
            uploadedPhotos.push(result.rows[0]);
        }

        res.json({
            success: true,
            data: uploadedPhotos,
            message: `${uploadedPhotos.length} fotó sikeresen feltöltve`
        });
    } catch (error) {
        next(error);
    }
});

// POST upload signature
router.post('/signature', upload.single('signature'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const { projectId, signatureType } = req.body; // customer or contractor

        const ext = path.extname(req.file.originalname);
        const filename = `sig-${signatureType}-${Date.now()}${ext}`;
        const storagePath = `signatures/${projectId}/${filename}`;

        const publicUrl = await uploadFile(req.file.buffer, req.file.mimetype, storagePath);

        // Update document record with signature path (URL now)
        await query(
            `UPDATE documents 
       SET ${signatureType}_signature_path = $1
       WHERE project_id = $2`,
            [publicUrl, projectId]
        );

        res.json({
            success: true,
            data: {
                url: publicUrl,
                fileName: filename
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET photos by project
router.get('/photos/:projectId', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM photos WHERE project_id = $1 ORDER BY taken_at DESC',
            [req.params.projectId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
