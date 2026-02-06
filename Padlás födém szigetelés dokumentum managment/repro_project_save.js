const { transaction } = require('./backend/config/database');
const Project = require('./backend/models/Project');

// Mock user
const user = {
    id: 1, // Assuming admin user id
    organization_id: '123e4567-e89b-12d3-a456-426614174000', // need a valid UUID? no, I should check what is in the DB
    // Use the one from the migration script or known dev data
    role: 'admin'
};

async function run() {
    console.log('🚀 Starting reproduction script...');

    try {
        // First get a valid user to use
        const { query } = require('./backend/config/database');
        const userResult = await query('SELECT * FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.error('❌ No users found in DB');
            process.exit(1);
        }
        const dbUser = userResult.rows[0];
        console.log('👤 Using user:', dbUser.email, dbUser.id, dbUser.organization_id);

        const projectData = {
            customer: {
                full_name: 'Test Repro',
                phone: '123456789',
                email: 'test@test.com',
                address_postal_code: '1234',
                address_city: 'Test City',
                address_street: 'Test Street',
                address_house_number: '1'
            },
            property: {
                hrsz: '123/456',
                address_postal_code: '1234',
                address_city: 'Test City',
                address_street: 'Test Street',
                address_house_number: '1',
                building_year: 2000,
                building_type: 'családi ház',
                structure_type: 'fa',
                structure_thickness: 20,
                unheated_space_type: 'nincs'
            },
            details: {
                gross_area: 100,
                net_area: 90,
                net_amount: 100000,
                energy_saving_gj: 10,
                hem_value: 100000,
                insulation_type: 'Test',
                vapor_barrier_type: 'Test',
                breathable_membrane_type: 'Test'
            }
        };

        const result = await transaction(async (client) => {
            const contract_number = await Project.generateContractNumber();
            console.log('📝 Generated contract number:', contract_number);

            const projectResult = await client.query(
                'INSERT INTO projects (contract_number, status, organization_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [contract_number, 'draft', dbUser.organization_id, dbUser.id]
            );
            console.log('✅ Project inserted:', projectResult.rows[0].id);
            const project = projectResult.rows[0];

            const customerResult = await client.query(
                `INSERT INTO customers (full_name, phone, email, address_postal_code, address_city, address_street, address_house_number)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [projectData.customer.full_name, projectData.customer.phone, projectData.customer.email,
                projectData.customer.address_postal_code, projectData.customer.address_city,
                projectData.customer.address_street, projectData.customer.address_house_number]
            );
            console.log('✅ Customer inserted:', customerResult.rows[0].id);
            const newCustomer = customerResult.rows[0];

            const propertyResult = await client.query(
                `INSERT INTO properties (customer_id, hrsz, address_postal_code, address_city, address_street, address_house_number, building_year, building_type, structure_type, structure_thickness, unheated_space_type)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [newCustomer.id, projectData.property.hrsz,
                projectData.property.address_postal_code, projectData.property.address_city, projectData.property.address_street, projectData.property.address_house_number,
                projectData.property.building_year, projectData.property.building_type, projectData.property.structure_type,
                projectData.property.structure_thickness, projectData.property.unheated_space_type]
            );
            console.log('✅ Property inserted:', propertyResult.rows[0].id);
            const newProperty = propertyResult.rows[0];

            // Note: I'm not inserting all columns here, just the main ones to test.
            // If the schema matches routes/projects.js, this might succeed where the full route fails,
            // but if basic constraints are met, it's a start.

            const detailsResult = await client.query(
                `INSERT INTO project_details (
                    project_id, customer_id, property_id, 
                    gross_area, net_area, net_amount, energy_saving_gj, hem_value, insulation_type, vapor_barrier_type, breathable_membrane_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [project.id, newCustomer.id, newProperty.id,
                projectData.details.gross_area, projectData.details.net_area, projectData.details.net_amount,
                projectData.details.energy_saving_gj, projectData.details.hem_value,
                projectData.details.insulation_type, projectData.details.vapor_barrier_type, projectData.details.breathable_membrane_type]
            );
            console.log('✅ Project Details inserted:', detailsResult.rows[0].id);

            // Rollback intentionally so we don't spam DB, or keep it?
            // Let's throw error to rollback
            throw new Error('ROLLBACK_TEST');
        });

    } catch (err) {
        if (err.message === 'ROLLBACK_TEST') {
            console.log('✅ Transaction logic verified (rolled back).');
        } else {
            console.error('❌ Transaction failed:', err);
        }
    } finally {
        process.exit(0);
    }
}

run();
