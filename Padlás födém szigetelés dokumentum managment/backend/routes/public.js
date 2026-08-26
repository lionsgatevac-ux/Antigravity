const express = require('express');
const router = express.Router();
const { transaction, query } = require('../config/database');
const Project = require('../models/Project');

// POST /lead - Handle public lead submission
router.post('/lead', async (req, res, next) => {
    try {
        console.log('[PUBLIC] Received lead submission:', JSON.stringify(req.body, null, 2));
        const { api_key, ...leadData } = req.body;
        const providedKey = api_key || req.header('X-API-Key');

        // Security check for public API
        const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
        if (PUBLIC_API_KEY && providedKey !== PUBLIC_API_KEY) {
    console.warn('[PUBLIC] Unauthorized lead submission attempt (Invalid API Key)');
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing API Key' });
}

const {
    name,
    email,
    phone,
    postal_code,
    city,
    street,
    house_number,
    msg, // Optional message
    // Property details
    property_postal_code,
    property_city,
    property_street,
    property_house_number,
    hrsz,
    area_size
} = leadData;

// Validation
if (!name || !email || !phone) {
    return res.status(400).json({ success: false, error: 'Name, email, and phone are required' });
}

// 1. Find a Default User/Organization to assign the lead to
// Strategy: Assign to the first Admin user found.
const adminResult = await query(
    `SELECT id, organization_id 
             FROM users 
             WHERE role = 'admin' 
             LIMIT 1`
);

if (adminResult.rows.length === 0) {
    console.error('[PUBLIC] No admin user found to assign lead!');
    throw new Error('System configuration error: No admin user found.');
}

const adminUser = adminResult.rows[0];
const assignedUserId = adminUser.id;
const assignedOrgId = adminUser.organization_id;

const result = await transaction(async (client) => {
    // Generate contract number (using Project model helper)
    const contract_number = await Project.generateContractNumber();

    // Create Project (Status: 'lead')
    // Note: If 'lead' status enum doesn't exist, we might default to 'draft'
    // Let's assume 'draft' for now to be safe, or check status constraints.
    // Using 'draft' is safer unless we are sure 'lead' exists.
    // We'll add a 'creation_source' or similar note if possible, 
    // but for now relying on status 'draft' is okay.
    const projectResult = await client.query(
        'INSERT INTO projects (contract_number, status, organization_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [contract_number, 'draft', assignedOrgId, assignedUserId]
    );
    const project = projectResult.rows[0];

    // Create Customer
    const customerResult = await client.query(
        `INSERT INTO customers (full_name, email, phone, address_postal_code, address_city, address_street, address_house_number)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, email, phone, postal_code, city, street, house_number]
    );
    const newCustomer = customerResult.rows[0];

    // Create Property
    // Use property address if provided, otherwise fallback to customer address (if same)
    const propZip = property_postal_code || postal_code;
    const propCity = property_city || city;
    const propStreet = property_street || street;
    const propNum = property_house_number || house_number;

    const propertyResult = await client.query(
        `INSERT INTO properties (customer_id, address_postal_code, address_city, address_street, address_house_number, hrsz)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [newCustomer.id, propZip, propCity, propStreet, propNum, hrsz]
    );
    const newProperty = propertyResult.rows[0];

    // Create Project Details
    // Initialize with basic defaults or empty values
    const detailsResult = await client.query(
        `INSERT INTO project_details (project_id, customer_id, property_id, gross_area)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
        [project.id, newCustomer.id, newProperty.id, area_size ? (() => {
            const n = parseFloat(String(area_size).trim().replace(',', '.'));
            return isNaN(n) ? null : Math.round(n * 100) / 100;
        })() : null]
    );

    // TODO: Store 'msg' somewhere? Notes table?
    // For now we might lose 'msg' unless we have a notes field.

    return {
        project,
        customer: newCustomer,
        property: newProperty,
        details: detailsResult.rows[0]
    };
});

res.status(201).json({ success: true, message: 'Lead submitted successfully', projectId: result.project.id });

    } catch (error) {
    console.error('[PUBLIC] Error submitting lead:', error);
    try {
        const fs = require('fs');
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'LEAD_SUBMISSION_ERROR',
            error: error.message,
            stack: error.stack,
            body: req.body
        };
        fs.appendFileSync('backend_error.json', JSON.stringify(logEntry, null, 2) + ',\n');
    } catch (logErr) {
        console.error('Failed to write to backend_error.json', logErr);
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
}
});

module.exports = router;
