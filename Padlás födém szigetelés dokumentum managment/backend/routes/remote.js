const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const Project = require('../models/Project');

// Middleware to verify token
const verifyToken = async (req, res, next) => {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

    try {
        console.log('Verifying remote token:', token);

        // Find project by token only first
        const result = await query(
            'SELECT id, remote_signature_token, remote_signature_expires_at FROM projects WHERE remote_signature_token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            console.log('Token NOT found in DB');
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        const projectData = result.rows[0];
        const expiresAt = new Date(projectData.remote_signature_expires_at);
        const now = new Date();

        console.log('Expiry Check:', {
            tokenInDB: projectData.remote_signature_token ? 'Exists' : 'NULL',
            expiresAt: expiresAt.toISOString(),
            now: now.toISOString(),
            isValid: expiresAt > now
        });

        if (expiresAt <= now) {
            console.log('Token EXPIRED');
            return res.status(401).json({ success: false, error: 'Link expired' });
        }

        // Fetch full details
        const fullProject = await Project.findById(projectData.id);

        if (!fullProject) {
            console.log('Full project details not found for ID:', projectData.id);
            return res.status(404).json({ success: false, error: 'Project details not found' });
        }

        // Check if already signed (Belt and braces: if token exists but signature also exists, consider it used)
        if (fullProject.customer_signature_data) {
            console.log('Project is ALREADY SIGNED. Rejecting token.');
            return res.status(401).json({ success: false, error: 'Document already signed' });
        }

        req.project = fullProject;

        // Disable caching for all remote endpoints
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// GET verify token and return project data
router.get('/verify/:token', verifyToken, async (req, res) => {
    const project = req.project;

    // Return only necessary data for the client to see
    res.json({
        success: true,
        data: {
            id: project.id,
            contract_number: project.contract_number,
            full_name: project.full_name,
            customer_address: `${project.customer_postal_code} ${project.customer_city}, ${project.customer_street} ${project.customer_house_number}`,
            property_address: `${project.property_postal_code} ${project.property_city}, ${project.property_street} ${project.property_house_number}`,
            signed_at: project.customer_signed_at
        }
    });
});

// POST save signature
router.post('/sign/:token', verifyToken, async (req, res) => {
    const { signatureData } = req.body;
    const project = req.project;

    if (!signatureData) {
        console.error('Missing signatureData in body:', req.body);
        return res.status(400).json({ success: false, error: 'Signature data is required' });
    }

    console.log(`Received signature data (Type: ${typeof signatureData}, Length: ${signatureData ? signatureData.length : 'N/A'})`);
    if (signatureData && signatureData.length > 50) {
        console.log('Signature snippet:', signatureData.substring(0, 50));
    }

    const fs = require('fs');
    const logInfo = (msg) => {
        try {
            fs.appendFileSync('debug_remote.log', new Date().toISOString() + ' ' + msg + '\n');
        } catch (e) { console.error(e); }
    };

    logInfo(`[START] Sign request for token: ${req.params.token}`);
    logInfo(`Payload Type: ${typeof signatureData}, Length: ${signatureData ? signatureData.length : 'N/A'}`);

    try {
        console.log(`Saving signature for project ID: ${project.id}`);
        logInfo(`Attempting UPDATE for Project ID: ${project.id}`);

        const result = await query(
            'UPDATE projects SET customer_signature_data = $1, customer_signed_at = NOW(), updated_at = NOW(), remote_signature_token = NULL WHERE id = $2',
            [signatureData, project.id]
        );

        console.log('Signature save result:', result.rowCount, 'rows updated.');
        logInfo(`UPDATE Result: ${result.rowCount} rows affected.`);

        if (result.rowCount === 0) {
            console.error(`❌ UPDATE FAILED: No rows updated for project ID ${project.id}`);
            logInfo(`❌ UPDATE FAILED: No rows updated.`);
            return res.status(500).json({ success: false, error: 'Database update failed - No rows affected' });
        }

        logInfo(`✅ SUCCESS: Signature saved.`);
        res.json({ success: true, message: 'Signature saved successfully' });
    } catch (error) {
        console.error('Error saving signature:', error);
        logInfo(`❌ EXCEPTION: ${error.message}`);
        res.status(500).json({ success: false, error: 'Error saving signature: ' + error.message });
    }
});

module.exports = router;
