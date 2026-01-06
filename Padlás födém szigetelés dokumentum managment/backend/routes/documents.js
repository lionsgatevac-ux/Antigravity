const express = require('express');
const router = express.Router();
const documentGenerator = require('../services/documentGenerator');
const Project = require('../models/Project');

// POST generate document
router.post('/generate', async (req, res, next) => {
    try {
        const { projectId, documentType } = req.body;

        // Validate document type
        const validTypes = ['kivitelezesi_szerzodes', 'atadas_atveteli', 'kivitelezoi_nyilatkozat', 'megallapodas_hem'];
        if (!validTypes.includes(documentType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid document type'
            });
        }

        // Get project data
        const projectData = await Project.findById(projectId);
        if (!projectData) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Get Floor Plan (latest)
        const { query } = require('../config/database');
        const floorPlanResult = await query(
            "SELECT file_path FROM photos WHERE project_id = $1 AND photo_type = 'floor_plan' ORDER BY taken_at DESC LIMIT 1",
            [projectId]
        );

        let floorPlanBase64 = '';
        if (floorPlanResult.rows.length > 0) {
            try {
                const fs = require('fs');
                const path = require('path');
                let fpPath = floorPlanResult.rows[0].file_path;
                console.log(`[DEBUG] Found floor plan record. ID: ${projectId}, Path: ${fpPath}`);

                let fileBuffer = null;

                // 1. Try exact path from DB
                if (fs.existsSync(fpPath)) {
                    console.log(`[DEBUG] Document generation: Floor plan found at exact path: ${fpPath}`);
                    fileBuffer = fs.readFileSync(fpPath);
                }
                // 2. Try absolute path resolution
                else {
                    const absPath = path.resolve(process.cwd(), fpPath);
                    if (fs.existsSync(absPath)) {
                        console.log(`[DEBUG] Document generation: Floor plan found at resolved absolute path: ${absPath}`);
                        fileBuffer = fs.readFileSync(absPath);
                    }
                    // 3. Try finding it in the uploads folder by filename only
                    else {
                        const filename = path.basename(fpPath);
                        const fallbackPath = path.join(__dirname, '..', 'uploads', 'floor_plan', filename);
                        if (fs.existsSync(fallbackPath)) {
                            console.log(`[DEBUG] Document generation: Floor plan found at fallback path: ${fallbackPath}`);
                            fileBuffer = fs.readFileSync(fallbackPath);
                        } else {
                            console.error(`[ERROR] Floor plan NOT found. Tried: ${fpPath}, ${absPath}, ${fallbackPath}`);
                        }
                    }
                }

                if (fileBuffer) {
                    floorPlanBase64 = 'data:image/png;base64,' + fileBuffer.toString('base64');
                    console.log('✅ Floor plan loaded successfully for document.');
                }
            } catch (err) {
                console.error('Failed to load floor plan image:', err);
            }
        }

        // Prepare data for template
        const templateData = {
            contract_number: projectData.contract_number,
            contract_date: new Date(),
            customer_name: projectData.full_name,
            customer_birth_name: projectData.birth_name,
            customer_mother_name: projectData.mother_name,
            customer_id_number: projectData.id_number,
            customer_phone: projectData.phone,
            customer_email: projectData.email,
            customer_address: {
                postalCode: projectData.customer_postal_code,
                city: projectData.customer_city,
                street: projectData.customer_street,
                houseNumber: projectData.customer_house_number
            },
            property_address: {
                postalCode: projectData.property_postal_code,
                city: projectData.property_city,
                street: projectData.property_street,
                houseNumber: projectData.property_house_number
            },
            hrsz: projectData.hrsz,
            building_year: projectData.building_year,
            building_type: projectData.building_type,
            structure_type: projectData.structure_type,
            structure_thickness: projectData.structure_thickness,
            unheated_space_type: projectData.unheated_space_type,
            unheated_space_area: projectData.unheated_space_area,
            unheated_space_name: projectData.unheated_space_name,
            gross_area: projectData.gross_area,
            chimney_area: projectData.chimney_area,
            attic_door_area: projectData.attic_door_area,
            other_deducted_area: projectData.other_deducted_area,
            net_area: projectData.net_area,
            insulation_thickness: projectData.insulation_thickness,
            r_value: projectData.r_value,
            work_start_date: projectData.work_start_date,
            work_end_date: projectData.work_end_date,
            handover_date: projectData.handover_date,
            net_amount: projectData.net_amount,
            net_amount_words: projectData.net_amount_words,
            labor_cost: projectData.labor_cost,
            energy_saving_gj: projectData.energy_saving_gj,
            hem_value: projectData.hem_value,
            government_support: projectData.government_support,

            attic_door_insulated: projectData.attic_door_insulated,

            // Materials
            insulation_type: projectData.insulation_type,
            vapor_barrier_type: projectData.vapor_barrier_type,
            breathable_membrane_type: projectData.breathable_membrane_type,

            // Signatures
            customer_signature_data: projectData.customer_signature_data,
            contractor_signature_data: projectData.contractor_signature_data,

            // Floor Plan
            alaprajz: floorPlanBase64
        };

        // DEBUG: Log template data
        console.log('🔍 TEMPLATE DATA FOR DOCUMENT GENERATION:');
        console.log('   structure_type:', templateData.structure_type);
        console.log('   structure_thickness:', templateData.structure_thickness);
        console.log('   unheated_space_type:', templateData.unheated_space_type);
        console.log('   unheated_space_area:', templateData.unheated_space_area);
        console.log('   unheated_space_name:', templateData.unheated_space_name);

        // Generate document
        const result = await documentGenerator.generate(documentType, templateData);

        // Save document record to database

        await query(
            `INSERT INTO documents (project_id, document_type, file_path, file_url)
       VALUES ($1, $2, $3, $4)`,
            [projectId, documentType, result.filePath, result.fileUrl]
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        // Log to file manually to verify
        const fs = require('fs');
        const path = require('path');
        try {
            fs.writeFileSync(path.join(__dirname, '../backend_error.json'), JSON.stringify({
                message: error.message,
                stack: error.stack,
                type: 'ROUTE_ERROR' // Identified as coming from the Route
            }, null, 2));
        } catch (e) {
            console.error('Failed to log route error', e);
        }
        next(error);
    }
});

// GET download document
router.get('/download/:fileName', (req, res, next) => {
    try {
        const path = require('path');
        console.log('📥 Download request for:', req.params.fileName);
        const filePath = path.join(__dirname, '..', 'generated', req.params.fileName);

        if (!require('fs').existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.download(filePath);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
