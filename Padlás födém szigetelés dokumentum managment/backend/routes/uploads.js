const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { query } = require('../config/database');

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

        // Save photo record to database
        const result = await query(
            `INSERT INTO photos (project_id, photo_type, file_path, file_url, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                projectId,
                photoType || 'general',
                req.file.path,
                `/uploads/${photoType || 'general'}/${req.file.filename}`,
                JSON.stringify({
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                })
            ]
        );

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                url: result.rows[0].file_url,
                fileName: req.file.filename
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
        const uploadedPhotos = [];

        for (const file of req.files) {
            const result = await query(
                `INSERT INTO photos (project_id, photo_type, file_path, file_url, metadata)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [
                    projectId,
                    photoType || 'general',
                    file.path,
                    `/uploads/${photoType || 'general'}/${file.filename}`,
                    JSON.stringify({
                        originalName: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype
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

        // Update document record with signature path
        await query(
            `UPDATE documents 
       SET ${signatureType}_signature_path = $1
       WHERE project_id = $2`,
            [req.file.path, projectId]
        );

        res.json({
            success: true,
            data: {
                url: `/uploads/${req.file.filename}`,
                fileName: req.file.filename
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
