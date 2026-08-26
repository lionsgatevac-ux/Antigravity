const express = require('express');
console.log('LOADING ROUTES: backend/routes/projects.js');
const router = express.Router();
const Project = require('../models/Project');
const Customer = require('../models/Customer');
const ProjectDetails = require('../models/ProjectDetails');
const { transaction, query } = require('../config/database');
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
        console.error('ERROR FETCHING PROJECTS:', error);

        try {
            const fs = require('fs');
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'FETCH_PROJECTS_ERROR',
                error: error.message,
                stack: error.stack,
                user: req.user
            };
            fs.appendFileSync('debug_errors.json', JSON.stringify(logEntry, null, 2) + ',\n');
        } catch (logErr) {
            console.error('Failed to write to debug_errors.json', logErr);
        }

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
        // Accepts comma as decimal separator (Hungarian locale) and defensively
        // rounds to 2 decimals to avoid IEEE754 float precision loss (181.83 → 181.82 bug)
        const sanitizeNumeric = (value) => {
            if (value === '' || value === null || value === undefined) return null;
            const strVal = String(value).trim().replace(',', '.');
            const num = parseFloat(strVal);
            if (isNaN(num)) return null;
            return Math.round(num * 100) / 100;
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
            unheated_space_area: sanitizeNumeric(property.unheated_space_area),
            heating_type: sanitizeString(property.heating_type)
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
            breathable_membrane_type: sanitizeString(details.breathable_membrane_type),
            // New Attic Declaration Fields
            pf_kivul_fodemen: Boolean(details.pf_kivul_fodemen),
            pf_kivul_oromfal: Boolean(details.pf_kivul_oromfal),
            pf_kivul_bonthato: Boolean(details.pf_kivul_bonthato),
            pf_kivul_egyeb: Boolean(details.pf_kivul_egyeb),
            pf_kivul_egyeb_szoveg: sanitizeString(details.pf_kivul_egyeb_szoveg),
            work_hour_start: sanitizeNumeric(details.work_hour_start) || 9,
            work_hour_end: sanitizeNumeric(details.work_hour_end) || 16,
            execution_date: details.execution_date || null,
            manual_quantities: details.manual_quantities || {}
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
                `INSERT INTO properties (customer_id, address_postal_code, address_city, address_street, address_house_number, hrsz, building_year, building_type, structure_type, structure_thickness, unheated_space_type, unheated_space_area, unheated_space_name, heating_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
                [newCustomer.id, sanitizedProperty.address_postal_code, sanitizedProperty.address_city,
                sanitizedProperty.address_street, sanitizedProperty.address_house_number, sanitizedProperty.hrsz,
                sanitizedProperty.building_year, sanitizedProperty.building_type,
                sanitizedProperty.structure_type, sanitizedProperty.structure_thickness,
                sanitizedProperty.unheated_space_type, sanitizedProperty.unheated_space_area, sanitizedProperty.unheated_space_name,
                sanitizedProperty.heating_type]
            );
            const newProperty = propertyResult.rows[0];

            // Create project details (fixed SQL with hem_value)
            const detailsResult = await client.query(
                `INSERT INTO project_details (
                    project_id, customer_id, property_id, 
                    gross_area, chimney_area, attic_door_area, other_deducted_area, 
                    net_area, net_amount, energy_saving_gj, labor_cost, 
                    hem_value, government_support, insulation_type, 
                    vapor_barrier_type, breathable_membrane_type,
                    pf_kivul_fodemen, pf_kivul_oromfal, pf_kivul_bonthato, pf_kivul_egyeb, pf_kivul_egyeb_szoveg,
                    work_hour_start, work_hour_end, execution_date, work_start_date, work_end_date
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) RETURNING *`,
                [project.id, newCustomer.id, newProperty.id,
                sanitizedDetails.gross_area, sanitizedDetails.chimney_area, sanitizedDetails.attic_door_area,
                sanitizedDetails.other_deducted_area, sanitizedDetails.net_area, sanitizedDetails.net_amount,
                sanitizedDetails.energy_saving_gj, sanitizedDetails.labor_cost, sanitizedDetails.hem_value,
                sanitizedDetails.government_support, sanitizedDetails.insulation_type,
                sanitizedDetails.vapor_barrier_type, sanitizedDetails.breathable_membrane_type,
                sanitizedDetails.pf_kivul_fodemen, sanitizedDetails.pf_kivul_oromfal, sanitizedDetails.pf_kivul_bonthato,
                sanitizedDetails.pf_kivul_egyeb, sanitizedDetails.pf_kivul_egyeb_szoveg,
                sanitizedDetails.work_hour_start, sanitizedDetails.work_hour_end, sanitizedDetails.execution_date,
                sanitizedDetails.execution_date, sanitizedDetails.execution_date]
            );

            // --- AUTO-DEDUCT MATERIALS FROM USER STOCK ---
            const materialsToDeduct = [];
            const netArea = Number(sanitizedDetails.net_area) || 0;
            console.log(`[AutoDeduct] Starting. NetArea: ${netArea}`);

            if (netArea > 0) {
                // Collect material names to resolve
                const materialNames = [
                    sanitizedDetails.insulation_type,
                    sanitizedDetails.vapor_barrier_type,
                    sanitizedDetails.breathable_membrane_type
                ].filter(name => name && name.trim() !== '');

                console.log(`[AutoDeduct] Material Names:`, materialNames);

                if (materialNames.length > 0) {
                    // 1. Fetch Material Metadata (ID, coverage)
                    const matQuery = await client.query(
                        'SELECT id, name, coverage, unit FROM materials WHERE name = ANY($1)',
                        [materialNames]
                    );

                    const materialMap = new Map(matQuery.rows.map(m => [m.name, m]));
                    const manualQuantities = sanitizedDetails.manual_quantities;
                    console.log(`[AutoDeduct] Manual Quantities:`, manualQuantities);

                    // 2. Calculate Quantities
                    // Helper to push to list
                    const pushDeduction = (matName, categoryKey) => {
                        console.log(`[AutoDeduct] Processing ${categoryKey}: ${matName}`);
                        const mat = materialMap.get(matName);
                        if (mat) {
                            let quantity = 0;
                            // Check manual quantity first
                            if (manualQuantities && manualQuantities[categoryKey] && !isNaN(manualQuantities[categoryKey]) && Number(manualQuantities[categoryKey]) > 0) {
                                quantity = Number(manualQuantities[categoryKey]);
                                console.log(`[AutoDeduct] Used manual quantity: ${quantity}`);
                            }
                            // Fallback to coverage calculation
                            else if (mat.coverage && mat.coverage > 0) {
                                quantity = Math.ceil(netArea / mat.coverage);
                                console.log(`[AutoDeduct] Calculated quantity: ${quantity} (Coverage: ${mat.coverage})`);
                            } else {
                                console.warn(`[AutoDeduct] coverage missing and no manual qty for ${matName}, skipping auto-deduction`);
                                return;
                            }

                            if (quantity > 0) {
                                materialsToDeduct.push({ ...mat, quantity });
                            }
                        } else {
                            console.warn(`[AutoDeduct] Material not found in Map: ${matName}`);
                        }
                    };

                    pushDeduction(sanitizedDetails.insulation_type, 'insulation');
                    pushDeduction(sanitizedDetails.vapor_barrier_type, 'vapor_barrier');
                    pushDeduction(sanitizedDetails.breathable_membrane_type, 'breathable_membrane');

                    console.log(`[AutoDeduct] Materials to deduct:`, materialsToDeduct);

                    // 3. Check Stock and Deduct
                    for (const item of materialsToDeduct) {
                        console.log(`[AutoDeduct] Deducting ${item.quantity} of ${item.name}`);
                        // Check User Stock (Copied logic from inventory.js)
                        const stockRes = await client.query(`
                            SELECT 
                                COALESCE(SUM(CASE 
                                    WHEN t.recipient_user_id = $1 AND t.status = 'COMPLETED' AND t.project_id IS NULL THEN t.quantity 
                                    WHEN t.created_by = $1 AND t.transaction_type = 'USAGE' THEN -t.quantity 
                                    ELSE 0 
                                END), 0) as current_stock
                            FROM material_transactions t
                            WHERE t.material_id = $2
                        `, [req.user.id, item.id]);

                        const currentStock = parseInt(stockRes.rows[0]?.current_stock || 0);

                        if (currentStock < item.quantity) {
                            console.warn(`[AutoDeduct] Negative stock warning for ${item.name}: Need ${item.quantity}, have ${currentStock}. Proceeding anyway.`);
                        }

                        // Deduct
                        await client.query(
                            `INSERT INTO material_transactions 
                            (material_id, quantity_change, quantity, transaction_type, project_id, status, notes, created_by) 
                            VALUES ($1, 0, $2, 'USAGE', $3, 'COMPLETED', $4, $5)`,
                            [item.id, item.quantity, project.id, 'Automatikus levonas projekt letrehozasakor', req.user.id]
                        );

                        console.log(`[AutoDeduct] Deducted ${item.quantity} of ${item.name} for project ${project.contract_number}`);
                    }
                }
            }
            // ---------------------------------------------

            return {
                project,
                customer: newCustomer,
                property: newProperty,
                details: detailsResult.rows[0]
            };
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('ERROR CREATING PROJECT:', error);
        console.error('Request Body:', JSON.stringify(req.body, null, 2));

        try {
            const fs = require('fs');
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'CREATE_PROJECT_ERROR',
                error: error.message,
                stack: error.stack,
                body: req.body,
                user: req.user
            };
            fs.appendFileSync('debug_errors.json', JSON.stringify(logEntry, null, 2) + ',\n');
        } catch (logErr) {
            console.error('Failed to write to debug_errors.json', logErr);
        }

        next(error);
    }
});

// PUT bulk update project status (MUST be before /:id to avoid route conflict)
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

// PUT full update project (customer, property, details)
router.put('/:id/full_update', async (req, res, next) => {
    try {
        const projectId = req.params.id;
        console.log(`[DEBUG] Full update for project ${projectId}`);
        const { customer, property, details } = req.body;

        // Sanitize numeric fields - convert empty strings to null
        // Accepts comma as decimal separator (Hungarian locale) and defensively
        // rounds to 2 decimals to avoid IEEE754 float precision loss (181.83 → 181.82 bug)
        const sanitizeNumeric = (value) => {
            if (value === '' || value === null || value === undefined) return null;
            const strVal = String(value).trim().replace(',', '.');
            const num = parseFloat(strVal);
            if (isNaN(num)) return null;
            return Math.round(num * 100) / 100;
        };

        // Sanitize string fields
        const sanitizeString = (value) => {
            if (value === undefined || value === null) return null;
            const str = String(value).trim();
            if (str === 'undefined' || str === 'null') return null;
            return str;
        };

        // Sanitize property data
        const sanitizedProperty = {
            ...property,
            hrsz: sanitizeString(property.hrsz),
            building_year: sanitizeNumeric(property.building_year),
            structure_thickness: sanitizeNumeric(property.structure_thickness),
            unheated_space_area: sanitizeNumeric(property.unheated_space_area),
            heating_type: sanitizeString(property.heating_type)
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
            breathable_membrane_type: sanitizeString(details.breathable_membrane_type),
            // New Attic Declaration Fields
            pf_kivul_fodemen: Boolean(details.pf_kivul_fodemen),
            pf_kivul_oromfal: Boolean(details.pf_kivul_oromfal),
            pf_kivul_bonthato: Boolean(details.pf_kivul_bonthato),
            pf_kivul_egyeb: Boolean(details.pf_kivul_egyeb),
            pf_kivul_egyeb_szoveg: sanitizeString(details.pf_kivul_egyeb_szoveg),
            work_hour_start: sanitizeNumeric(details.work_hour_start) || 9,
            work_hour_end: sanitizeNumeric(details.work_hour_end) || 16,
            execution_date: details.execution_date || null
        };

        const result = await transaction(async (client) => {
            // 1. Verify project exists and user has access
            const projectCheck = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
            if (projectCheck.rows.length === 0) {
                throw new Error('Project not found');
            }

            // Get current IDs
            const detailsQuery = await client.query('SELECT * FROM project_details WHERE project_id = $1', [projectId]);
            if (detailsQuery.rows.length === 0) {
                throw new Error('Project details not found');
            }
            const currentDetails = detailsQuery.rows[0];
            const customerId = currentDetails.customer_id;
            const propertyId = currentDetails.property_id;

            const customerResult = await client.query(
                `UPDATE customers SET 
                    full_name = $1, birth_name = $2, mother_name = $3, id_number = $4, 
                    phone = $5, email = $6, 
                    address_postal_code = $7, address_city = $8, address_street = $9, address_house_number = $10
                 WHERE id = $11
                 RETURNING *`,
                [sanitizeString(customer.full_name), sanitizeString(customer.birth_name), sanitizeString(customer.mother_name),
                sanitizeString(customer.id_number), sanitizeString(customer.phone), sanitizeString(customer.email),
                sanitizeString(customer.address_postal_code), sanitizeString(customer.address_city),
                sanitizeString(customer.address_street), sanitizeString(customer.address_house_number),
                    customerId]
            );

            // 3. Update Property
            const propertyResult = await client.query(
                `UPDATE properties SET
                    address_postal_code = $1, address_city = $2, address_street = $3, address_house_number = $4,
                    hrsz = $5, building_year = $6, building_type = $7, structure_type = $8,
                    structure_thickness = $9, unheated_space_type = $10, unheated_space_area = $11, unheated_space_name = $12, heating_type = $13
                 WHERE id = $14
                 RETURNING *`,
                [sanitizedProperty.address_postal_code, sanitizedProperty.address_city,
                sanitizedProperty.address_street, sanitizedProperty.address_house_number, sanitizedProperty.hrsz,
                sanitizedProperty.building_year, sanitizedProperty.building_type,
                sanitizedProperty.structure_type, sanitizedProperty.structure_thickness,
                sanitizedProperty.unheated_space_type, sanitizedProperty.unheated_space_area, sanitizedProperty.unheated_space_name,
                sanitizedProperty.heating_type,
                    propertyId]
            );

            // 4. Update Project Details
            const detailsResult = await client.query(
                `UPDATE project_details SET
                    gross_area = $1, chimney_area = $2, attic_door_area = $3, other_deducted_area = $4,
                    net_area = $5, net_amount = $6, energy_saving_gj = $7, labor_cost = $8,
                    hem_value = $9, government_support = $10, insulation_type = $11,
                    vapor_barrier_type = $12, breathable_membrane_type = $13,
                    pf_kivul_fodemen = $14, pf_kivul_oromfal = $15, pf_kivul_bonthato = $16,
                    pf_kivul_egyeb = $17, pf_kivul_egyeb_szoveg = $18, attic_door_insulated = $19,
                    work_hour_start = $20, work_hour_end = $21, execution_date = $22::date,
                    work_start_date = $22::timestamp, work_end_date = $22::timestamp
                 WHERE project_id = $23
                 RETURNING *`,
                [sanitizedDetails.gross_area, sanitizedDetails.chimney_area, sanitizedDetails.attic_door_area,
                sanitizedDetails.other_deducted_area, sanitizedDetails.net_area, sanitizedDetails.net_amount,
                sanitizedDetails.energy_saving_gj, sanitizedDetails.labor_cost, sanitizedDetails.hem_value,
                sanitizedDetails.government_support, sanitizedDetails.insulation_type,
                sanitizedDetails.vapor_barrier_type, sanitizedDetails.breathable_membrane_type,
                sanitizedDetails.pf_kivul_fodemen, sanitizedDetails.pf_kivul_oromfal, sanitizedDetails.pf_kivul_bonthato,
                sanitizedDetails.pf_kivul_egyeb, sanitizedDetails.pf_kivul_egyeb_szoveg, Boolean(details.attic_door_insulated),
                sanitizedDetails.work_hour_start, sanitizedDetails.work_hour_end, sanitizedDetails.execution_date,
                    projectId]
            );

            // 5. Update Project updated_at
            await client.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);

            return {
                project_id: projectId,
                customer: customerResult.rows[0],
                property: propertyResult.rows[0],
                details: detailsResult.rows[0]
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('ERROR UPDATING PROJECT:', error);

        try {
            const fs = require('fs');
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'UPDATE_PROJECT_ERROR',
                error: error.message,
                stack: error.stack,
                body: req.body,
                user: req.user
            };
            fs.appendFileSync('debug_errors.json', JSON.stringify(logEntry, null, 2) + ',\n');
        } catch (logErr) {
            console.error('Failed to write to debug_errors.json', logErr);
        }

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
            message: `${signatureType === 'customer' ? 'Ugyfel' : 'Kivitelezo'} alairas sikeresen mentve`
        });
    } catch (error) {
        console.error('ERROR SAVING SIGNATURE:', error);
        next(error);
    }
});

// Helper to get file content (remote or local)
async function getFileContent(filePath) {
    if (!filePath) return null;

    // Remote URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        try {
            console.log(`[ZIP] Downloading remote file: ${filePath}`);
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`[ZIP] Failed to fetch remote file: ${filePath}, status: ${response.status}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error(`[ZIP] Error downloading remote file: ${filePath}`, error);
            return null;
        }
    }

    // Local file - CAUTION on Cloud Run: Local files from previous deploys won't exist!
    const fs = require('fs');
    const path = require('path');

    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    }

    // Try resolving as relative to cwd
    const absPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(absPath)) {
        return fs.readFileSync(absPath);
    }

    console.warn(`[ZIP] File not found locally: ${filePath}`);
    return null;
}

// GET export project as ZIP
router.get('/:id/export', async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const PizZip = require('pizzip');
        const path = require('path');
        const { query } = require('../config/database');

        // 1. Fetch all data
        const projectData = await Project.findById(projectId);
        if (!projectData) return res.status(404).json({ success: false, error: 'Project not found' });

        const photosResult = await query('SELECT * FROM photos WHERE project_id = $1', [projectId]);
        const docsResult = await query('SELECT * FROM documents WHERE project_id = $1', [projectId]);

        const zip = new PizZip();

        // 2. Create Summary Text
        let summary = `PROJEKT OSSZESITO - ${projectData.contract_number}\n`;
        summary += `==========================================\n\n`;
        summary += `UGYFEL ADATAI:\n`;
        summary += `Nev: ${projectData.full_name}\n`;
        summary += `Lakcim: ${projectData.customer_postal_code} ${projectData.customer_city}, ${projectData.customer_street} ${projectData.customer_house_number}\n\n`;

        summary += `INGATLAN ADATAI:\n`;
        summary += `Cim: ${projectData.property_postal_code} ${projectData.property_city}, ${projectData.property_street} ${projectData.property_house_number}\n`;
        summary += `Futes tipusa: ${projectData.heating_type || '-'}\n`;

        zip.file('projekt_adatlap.txt', summary);

        // 3. Add Photos
        const photosFolder = zip.folder('Fotok');
        for (const photo of photosResult.rows) {
            try {
                let ext = path.extname(photo.file_path);
                if (!ext && photo.file_path.startsWith('http')) {
                    ext = '.png';
                }
                const filename = `${photo.photo_type}_${photo.id}${ext}`;

                const buffer = await getFileContent(photo.file_path);
                if (buffer) {
                    photosFolder.file(filename, buffer);
                } else {
                    console.warn(`[ZIP] Could not get content for photo ${photo.id} (${photo.file_path})`);
                    photosFolder.file(`MISSING_${photo.photo_type}_${photo.id}.txt`, `File could not be downloaded: ${photo.file_path}`);
                }
            } catch (err) {
                console.error(`[ZIP] Error processing photo ${photo.id}:`, err);
                photosFolder.file(`ERROR_${photo.photo_type}_${photo.id}.txt`, `Error: ${err.message}`);
            }
        }

        // 4. Add Documents (On-the-fly Generation)
        const documentGenerator = require('../services/documentGenerator');
        const fs = require('fs');

        // Prepare Template Data
        let floorPlanBase64 = '';
        if (projectData.floor_plan_url) {
            floorPlanBase64 = projectData.floor_plan_url;
        }

        const templateData = {
            ...projectData,
            customer_name: projectData.full_name,
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
            alaprajz: floorPlanBase64,
            owner_role: 'admin'
        };

        const docsFolder = zip.folder('Dokumentumok');
        const documentsToGenerate = ['kivitelezesi_szerzodes', 'atadas_atveteli', 'kivitelezoi_nyilatkozat', 'megallapodas_hem', 'tamogatas_igenylo'];

        for (const docType of documentsToGenerate) {
            try {
                console.log(`[ZIP] Generating document on-the-fly: ${docType}`);
                const result = await documentGenerator.generate(docType, templateData, 'docx');

                if (fs.existsSync(result.filePath)) {
                    const buffer = fs.readFileSync(result.filePath);
                    docsFolder.file(result.fileName, buffer);
                } else {
                    console.error(`[ZIP] Generated file not found: ${result.filePath}`);
                }
            } catch (err) {
                console.error(`[ZIP] Error generating doc ${docType}:`, err);
                docsFolder.file(`${docType}_ERROR.txt`, `Error: ${err.message}`);
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
        console.error('EXPORT ERROR:', error);
        next(error);
    }
});

// POST send remote signature request
router.post('/:id/remote-request', async (req, res, next) => {
    console.log(`[DEBUG] Received remote request for project: ${req.params.id}`);
    try {
        const projectId = req.params.id;
        const crypto = require('crypto');
        const { sendRemoteSignatureRequest } = require('../services/emailService');
        const documentGenerator = require('../services/documentGenerator');
        const { query } = require('../config/database');

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        if (!project.email) return res.status(400).json({ success: false, error: 'Customer email is missing' });

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3); // 3 days expiry

        // Update DB
        await query(
            'UPDATE projects SET remote_signature_token = $1, remote_signature_expires_at = $2 WHERE id = $3',
            [token, expiresAt, projectId]
        );

        let floorPlanBase64 = '';
        if (project.floor_plan_url) {
            floorPlanBase64 = project.floor_plan_url;
        }

        let floorPlanPlusBase64 = '';
        if (project.floor_plan_plus_url) {
            floorPlanPlusBase64 = project.floor_plan_plus_url;
        }

        const templateData = {
            contract_number: project.contract_number,
            contract_date: project.created_at || new Date(),
            customer_name: project.full_name,
            customer_birth_name: project.birth_name,
            customer_mother_name: project.mother_name,
            customer_id_number: project.id_number,
            customer_phone: project.phone,
            customer_email: project.email,
            customer_address: {
                postalCode: project.customer_postal_code,
                city: project.customer_city,
                street: project.customer_street,
                houseNumber: project.customer_house_number
            },
            property_address: {
                postalCode: project.property_postal_code,
                city: project.property_city,
                street: project.property_street,
                houseNumber: project.property_house_number
            },
            hrsz: project.hrsz,
            building_year: project.building_year,
            building_type: project.building_type,
            futes: project.heating_type,
            structure_type: project.structure_type,
            structure_thickness: project.structure_thickness,
            unheated_space_type: project.unheated_space_type,
            unheated_space_area: project.unheated_space_area,
            unheated_space_name: project.unheated_space_name,
            gross_area: project.gross_area,
            chimney_area: project.chimney_area,
            attic_door_area: project.attic_door_area,
            other_deducted_area: project.other_deducted_area,
            net_area: project.net_area,
            insulation_thickness: project.insulation_thickness,
            r_value: project.r_value,
            work_start_date: project.work_start_date,
            work_end_date: project.work_end_date,
            handover_date: project.handover_date,
            work_hour_start: project.work_hour_start,
            work_hour_end: project.work_hour_end,
            execution_date: project.execution_date,
            net_amount: project.net_amount,
            net_amount_words: project.net_amount_words,
            labor_cost: project.labor_cost,
            energy_saving_gj: project.energy_saving_gj,
            hem_value: project.hem_value,
            government_support: project.government_support,
            attic_door_insulated: project.attic_door_insulated,
            insulation_type: project.insulation_type,
            vapor_barrier_type: project.vapor_barrier_type,
            breathable_membrane_type: project.breathable_membrane_type,
            customer_signature_data: project.customer_signature_data,
            contractor_signature_data: project.contractor_signature_data,
            alaprajz: floorPlanBase64,
            alaprajzplusz: floorPlanPlusBase64
        };

        const documentsToGenerate = ['kivitelezesi_szerzodes', 'atadas_atveteli', 'kivitelezoi_nyilatkozat', 'megallapodas_hem', 'tamogatas_igenylo'];
        const attachments = [];

        for (const docType of documentsToGenerate) {
            try {
                const result = await documentGenerator.generate(docType, templateData);
                attachments.push({
                    filename: result.fileName,
                    path: result.filePath
                });
            } catch (err) {
                console.error(`Error generating ${docType} for email:`, err);
            }
        }

        await sendRemoteSignatureRequest(project.email, token, project, attachments);
        res.json({ success: true, message: 'Alairaskero email elkuldve!' });

    } catch (error) {
        console.error('Remote request error:', error);
        next(error);
    }
});

// POST send all signed documents to customer
router.post('/:id/send-documents', async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const { sendProjectDocuments } = require('../services/emailService');
        const documentGenerator = require('../services/documentGenerator');
        const { query } = require('../config/database');

        // Get project data
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        if (!project.customer_signature_data) {
            return res.status(400).json({
                success: false,
                error: 'Customer signature must be present before sending documents'
            });
        }

        if (!project.email) {
            return res.status(400).json({ success: false, error: 'Customer email is missing' });
        }

        let floorPlanBase64 = '';
        if (project.floor_plan_url) {
            floorPlanBase64 = project.floor_plan_url;
        }

        const templateData = {
            contract_number: project.contract_number,
            contract_date: project.created_at || new Date(),
            customer_name: project.full_name,
            customer_birth_name: project.birth_name,
            customer_mother_name: project.mother_name,
            customer_id_number: project.id_number,
            customer_phone: project.phone,
            customer_email: project.email,
            customer_address: {
                postalCode: project.customer_postal_code,
                city: project.customer_city,
                street: project.customer_street,
                houseNumber: project.customer_house_number
            },
            property_address: {
                postalCode: project.property_postal_code,
                city: project.property_city,
                street: project.property_street,
                houseNumber: project.property_house_number
            },
            hrsz: project.hrsz,
            building_year: project.building_year,
            building_type: project.building_type,
            structure_type: project.structure_type,
            structure_thickness: project.structure_thickness,
            unheated_space_type: project.unheated_space_type,
            unheated_space_area: project.unheated_space_area,
            unheated_space_name: project.unheated_space_name,
            gross_area: project.gross_area,
            chimney_area: project.chimney_area,
            attic_door_area: project.attic_door_area,
            other_deducted_area: project.other_deducted_area,
            net_area: project.net_area,
            insulation_thickness: project.insulation_thickness,
            r_value: project.r_value,
            work_start_date: project.work_start_date,
            work_end_date: project.work_end_date,
            handover_date: project.handover_date,
            work_hour_start: project.work_hour_start,
            work_hour_end: project.work_hour_end,
            execution_date: project.execution_date,
            net_amount: project.net_amount,
            net_amount_words: project.net_amount_words,
            labor_cost: project.labor_cost,
            energy_saving_gj: project.energy_saving_gj,
            hem_value: project.hem_value,
            government_support: project.government_support,
            attic_door_insulated: project.attic_door_insulated,
            insulation_type: project.insulation_type,
            vapor_barrier_type: project.vapor_barrier_type,
            breathable_membrane_type: project.breathable_membrane_type,
            customer_signature_data: project.customer_signature_data,
            contractor_signature_data: project.contractor_signature_data,
            alaprajz: floorPlanBase64
        };

        const documentsToGenerate = ['kivitelezesi_szerzodes', 'atadas_atveteli', 'kivitelezoi_nyilatkozat', 'megallapodas_hem', 'tamogatas_igenylo'];
        const attachments = [];

        for (const docType of documentsToGenerate) {
            try {
                const result = await documentGenerator.generate(docType, templateData);
                attachments.push({
                    filename: result.fileName,
                    path: result.filePath
                });
            } catch (err) {
                console.error(`Error generating ${docType} for email:`, err);
            }
        }

        if (attachments.length === 0) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate documents'
            });
        }

        await sendProjectDocuments(project.email, project, attachments);

        res.json({
            success: true,
            message: `Dokumentumok sikeresen elküldve ${project.email} cimre!`,
            documentCount: attachments.length
        });

    } catch (error) {
        console.error('Send documents error:', error);
        next(error);
    }
});


module.exports = router;
