const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Customer = require('../models/Customer');
const ProjectDetails = require('../models/ProjectDetails');
const { transaction } = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all project routes
router.use(authMiddleware);

// GET all projects
router.get('/', async (req, res, next) => {
    try {
        const { status } = req.query;
        const projects = await Project.findAll({ status }, req.user); // Pass user for filtering
        res.json({ success: true, data: projects });
    } catch (error) {
        next(error);
    }
});

// GET project by ID
router.get('/:id', async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id, req.user);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
});

// POST create new project (with customer and details)
router.post('/', async (req, res, next) => {
    try {
        const { customer, property, details } = req.body;

        // Sanitize numeric fields - convert empty strings to null
        const sanitizeNumeric = (value) => {
            if (value === '' || value === null || value === undefined) return null;
            const num = Number(value);
            return isNaN(num) ? null : num;
        };

        // Sanitize string fields - convert "undefined"/"null" strings to null
        const sanitizeString = (value) => {
            if (value === undefined || value === null) return null;
            const str = String(value).trim();
            if (str === 'undefined' || str === 'null') return null;
            return str;
        };

        // Sanitize property data
        const sanitizedProperty = {
            ...property,
            hrsz: sanitizeString(property.hrsz), // Clean HRSZ explicitly
            building_year: sanitizeNumeric(property.building_year),
            structure_thickness: sanitizeNumeric(property.structure_thickness),
            unheated_space_area: sanitizeNumeric(property.unheated_space_area)
        };

        // Sanitize details data
        const sanitizedDetails = {
            ...details,
            gross_area: sanitizeNumeric(details.gross_area),
            chimney_area: sanitizeNumeric(details.chimney_area),
            attic_door_area: sanitizeNumeric(details.attic_door_area),
            other_deducted_area: sanitizeNumeric(details.other_deducted_area),
            net_area: sanitizeNumeric(details.net_area),
            net_amount: sanitizeNumeric(details.net_amount),
            energy_saving_gj: sanitizeNumeric(details.energy_saving_gj),
            hem_value: sanitizeNumeric(details.hem_value),
            labor_cost: sanitizeNumeric(details.labor_cost),
            government_support: sanitizeNumeric(details.government_support),
            insulation_type: sanitizeString(details.insulation_type),
            vapor_barrier_type: sanitizeString(details.vapor_barrier_type),
            breathable_membrane_type: sanitizeString(details.breathable_membrane_type)
        };

        const result = await transaction(async (client) => {
            // Generate contract number
            const contract_number = await Project.generateContractNumber();

            // Create project
            const projectResult = await client.query(
                'INSERT INTO projects (contract_number, status, organization_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [contract_number, 'draft', req.user.organization_id, req.user.id] // Use organization_id and created_by
            );
            const project = projectResult.rows[0];

            // Create customer
            const customerResult = await client.query(
                `INSERT INTO customers (full_name, birth_name, mother_name, id_number, phone, email, address_postal_code, address_city, address_street, address_house_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [sanitizeString(customer.full_name), sanitizeString(customer.birth_name), sanitizeString(customer.mother_name),
                sanitizeString(customer.id_number), sanitizeString(customer.phone), sanitizeString(customer.email),
                sanitizeString(customer.address_postal_code), sanitizeString(customer.address_city),
                sanitizeString(customer.address_street), sanitizeString(customer.address_house_number)]
            );
            const newCustomer = customerResult.rows[0];

            // Create property
            const propertyResult = await client.query(
                `INSERT INTO properties (customer_id, address_postal_code, address_city, address_street, address_house_number, hrsz, building_year, building_type, structure_type, structure_thickness, unheated_space_type, unheated_space_area, unheated_space_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
                [newCustomer.id, sanitizedProperty.address_postal_code, sanitizedProperty.address_city,
                sanitizedProperty.address_street, sanitizedProperty.address_house_number, sanitizedProperty.hrsz,
                sanitizedProperty.building_year, sanitizedProperty.building_type,
                sanitizedProperty.structure_type, sanitizedProperty.structure_thickness,
                sanitizedProperty.unheated_space_type, sanitizedProperty.unheated_space_area, sanitizedProperty.unheated_space_name]
            );
            const newProperty = propertyResult.rows[0];

            // Create project details
            const detailsResult = await client.query(
                `INSERT INTO project_details (
                    project_id, customer_id, property_id, 
                    gross_area, chimney_area, attic_door_area, other_deducted_area, 
                    net_area, net_amount, energy_saving_gj, labor_cost, 
                    hem_value, government_support, insulation_type, 
                    vapor_barrier_type, breathable_membrane_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
                [project.id, newCustomer.id, newProperty.id,
                sanitizedDetails.gross_area, sanitizedDetails.chimney_area, sanitizedDetails.attic_door_area,
                sanitizedDetails.other_deducted_area, sanitizedDetails.net_area, sanitizedDetails.net_amount,
                sanitizedDetails.energy_saving_gj, sanitizedDetails.labor_cost, sanitizedDetails.hem_value,
                sanitizedDetails.government_support, sanitizedDetails.insulation_type,
                sanitizedDetails.vapor_barrier_type, sanitizedDetails.breathable_membrane_type]
            );

            return {
                project,
                customer: newCustomer,
                property: newProperty,
                details: detailsResult.rows[0]
            };
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('❌ ERROR CREATING PROJECT:', error);
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        next(error);
    }
});

// PUT update project status
router.put('/:id', async (req, res, next) => {
    try {
        const { status } = req.body;
        const project = await Project.update(req.params.id, { status });
        res.json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
});

// DELETE project
router.delete('/:id', async (req, res, next) => {
    try {
        await Project.delete(req.params.id);
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        next(error);
    }
});

// PUT bulk update project status
router.put('/bulk-status', async (req, res, next) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || !status) {
            return res.status(400).json({ success: false, error: 'Ids array and status are required' });
        }
        const result = await Project.bulkUpdateStatus(ids, status);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// PUT save signature (customer or contractor)
router.put('/:id/signature', async (req, res, next) => {
    try {
        const { signatureType, signatureData } = req.body;
        const projectId = req.params.id;

        // Validate signature type
        if (!['customer', 'contractor'].includes(signatureType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid signature type. Must be "customer" or "contractor"'
            });
        }

        // Validate signature data (Base64)
        if (!signatureData || !signatureData.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid signature data. Must be Base64 encoded image'
            });
        }

        const { query } = require('../config/database');

        // Save signature to database
        const columnName = signatureType === 'customer'
            ? 'customer_signature_data'
            : 'contractor_signature_data';
        const timestampColumn = signatureType === 'customer'
            ? 'customer_signed_at'
            : 'contractor_signed_at';

        const result = await query(
            `UPDATE projects 
             SET ${columnName} = $1, ${timestampColumn} = NOW(), updated_at = NOW()
             WHERE id = $2
             RETURNING id, contract_number, ${columnName}, ${timestampColumn}`,
            [signatureData, projectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: {
                projectId: result.rows[0].id,
                contractNumber: result.rows[0].contract_number,
                signatureType,
                signedAt: result.rows[0][timestampColumn]
            },
            message: `${signatureType === 'customer' ? 'Ügyfél' : 'Kivitelező'} aláírás sikeresen mentve`
        });
    } catch (error) {
        console.error('❌ ERROR SAVING SIGNATURE:', error);
        next(error);
    }
});

// GET export project as ZIP
router.get('/:id/export', async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const PizZip = require('pizzip');
        const fs = require('fs');
        const path = require('path');
        const { query } = require('../config/database');

        // 1. Fetch all data
        const projectData = await Project.findById(projectId);
        if (!projectData) return res.status(404).json({ success: false, error: 'Project not found' });

        const photosResult = await query('SELECT * FROM photos WHERE project_id = $1', [projectId]);
        const docsResult = await query('SELECT * FROM documents WHERE project_id = $1', [projectId]);

        const zip = new PizZip();

        // 2. Create Summary Text
        let summary = `PROJEKT ÖSSZESÍTŐ - ${projectData.contract_number}\n`;
        summary += `==========================================\n\n`;
        summary += `ÜGYFÉL ADATAI:\n`;
        summary += `Név: ${projectData.full_name}\n`;
        summary += `Telefon: ${projectData.phone}\n`;
        summary += `Email: ${projectData.email}\n`;
        summary += `Lakcím: ${projectData.customer_postal_code} ${projectData.customer_city}, ${projectData.customer_street} ${projectData.customer_house_number}\n\n`;

        summary += `INGATLAN ADATAI:\n`;
        summary += `Cím: ${projectData.property_postal_code} ${projectData.property_city}, ${projectData.property_street} ${projectData.property_house_number}\n`;
        summary += `HRSZ: ${projectData.hrsz || '-'}\n`;
        summary += `Épület típusa: ${projectData.building_type || '-'}\n\n`;

        summary += `MŰSZAKI ADATOK:\n`;
        summary += `Nettó terület: ${projectData.net_area} m2\n`;
        summary += `Szigetelés vastagsága: ${projectData.insulation_thickness} cm\n`;
        summary += `Energetikai megtakarítás: ${projectData.energy_saving_gj} GJ/év\n\n`;

        summary += `PÉNZÜGYI ADATOK:\n`;
        summary += `Nettó vállalási ár: ${projectData.net_amount} Ft\n`;
        summary += `Munkadíj: ${projectData.labor_cost} Ft\n`;
        summary += `HEM érték: ${projectData.hem_value} Ft\n`;

        zip.file('projekt_adatlap.txt', summary);

        // 3. Add Photos
        const photosFolder = zip.folder('Fotok');
        for (const photo of photosResult.rows) {
            const fullPath = path.resolve(photo.file_path);
            if (fs.existsSync(fullPath)) {
                const photoBuffer = fs.readFileSync(fullPath);
                const ext = path.extname(photo.file_path);
                photosFolder.file(`${photo.photo_type}_${photo.id}${ext}`, photoBuffer);
            }
        }

        // 4. Add Documents
        const docsFolder = zip.folder('Dokumentumok');
        for (const doc of docsResult.rows) {
            const fullPath = path.resolve(doc.file_path);
            if (fs.existsSync(fullPath)) {
                const docBuffer = fs.readFileSync(fullPath);
                const fileName = path.basename(doc.file_path);
                docsFolder.file(fileName, docBuffer);
            }
        }

        // 5. Add Signatures (if exist as data)
        if (projectData.customer_signature_data) {
            const base64Data = projectData.customer_signature_data.replace(/^data:image\/\w+;base64,/, '');
            zip.file('Signatures/ugyfel_alairas.png', Buffer.from(base64Data, 'base64'));
        }
        if (projectData.contractor_signature_data) {
            const base64Data = projectData.contractor_signature_data.replace(/^data:image\/\w+;base64,/, '');
            zip.file('Signatures/kivitelezo_alairas.png', Buffer.from(base64Data, 'base64'));
        }

        // 6. Generate and send ZIP
        const content = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename=Projekt_${projectData.contract_number}.zip`,
            'Content-Length': content.length
        });

        res.send(content);

    } catch (error) {
        console.error('❌ EXPORT ERROR:', error);
        next(error);
    }
});

module.exports = router;
