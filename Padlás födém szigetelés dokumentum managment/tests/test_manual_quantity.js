const axios = require('axios');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

// Port 4000 matches .env
const API_URL = 'http://localhost:4000/api';
const DB_CONFIG = {
    user: 'postgres',
    host: 'localhost',
    database: 'bozso_db',
    password: 'Biznisz matek',
    port: 5432,
};
const JWT_SECRET = 'fallback_secret_do_not_use_in_prod';

async function runTest() {
    let client;
    try {
        console.log('--- TEST: Manual Material Quantity Deduction ---');

        // 1. Connect DB and Get User
        console.log('Connecting to DB...');
        client = new Client(DB_CONFIG);
        await client.connect();

        const userRes = await client.query('SELECT id, email, organization_id FROM users LIMIT 1');
        if (userRes.rows.length === 0) throw new Error('No users found in DB');
        const user = userRes.rows[0];
        console.log('Using user:', user.email);

        // 2. Generate Token
        const token = jwt.sign({ id: user.id, email: user.email, organization_id: user.organization_id }, JWT_SECRET, { expiresIn: '1h' });
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Generated JWT token.');

        // 3. Get a material name
        console.log('Fetching materials...');
        const matRes = await axios.get(`${API_URL}/materials`, { headers });
        // The API returns grouped object now
        let materialName;
        // The API response structure: { success: true, data: { insulation: [], ... } }
        // BUT wait, projects.js uses manual_quantities keys 'insulation', 'vapor_barrier', etc.
        // And backend/routes/materials.js returns grouped object.
        const data = matRes.data.data;

        // Find existing insulation material
        if (data.insulation && data.insulation.length > 0) {
            const m = data.insulation[0];
            materialName = m.name || m;
        }

        if (!materialName) {
            // fallback to any
            for (const cat in data) {
                if (data[cat] && data[cat].length > 0) {
                    const m = data[cat][0];
                    materialName = m.name || m;
                    break;
                }
            }
        }

        if (!materialName) {
            throw new Error('No materials found.');
        }
        console.log(`Using material: ${materialName}`);

        // 4. Create Project with Manual Quantity
        const manualQty = 5;
        const projectData = {
            customer: {
                full_name: 'Test ManInput',
                email: 'test@man.input',
                phone: '123456789',
                address_postal_code: '1234',
                address_city: 'TestCity',
                address_street: 'TestStreet',
                address_house_number: '1'
            },
            property: {
                address_postal_code: '1234',
                address_city: 'TestCity',
                address_street: 'TestStreet',
                address_house_number: '1',
                hrsz: '123/45',
                heating_type: 'gaz'
            },
            details: {
                net_area: 100,
                // We assume the material selected is 'insulation' or we force it here?
                // The backend checks if manual_quantities[categoryKey] exists for the passed material name's category?
                // NO. The backend loop is manual:
                // pushDeduction(sanitizedDetails.insulation_type, 'insulation');
                // pushDeduction(sanitizedDetails.vapor_barrier_type, 'vapor_barrier');

                // So if we put our materialName into `insulation_type`, backend treats it as insulation category logic-wise
                // (it looks up manual_quantities['insulation']).
                insulation_type: materialName,

                manual_quantities: {
                    insulation: manualQty
                },

                gross_area: 120,
                chimney_area: 0,
                attic_door_area: 0,
                other_deducted_area: 0,
                net_amount: 100000,
                energy_saving_gj: 10,
                labor_cost: 50000,
                hem_value: 100000,
                government_support: 0
            }
        };

        console.log('Creating project...');
        const createRes = await axios.post(`${API_URL}/projects`, projectData, { headers });
        // Check if createRes.data.success exists
        if (!createRes.data.success) throw new Error('Create failed: ' + JSON.stringify(createRes.data));

        const projectId = createRes.data.data.id;
        console.log(`Project created. ID: ${projectId}`);

        // 5. Verify Transaction in Database
        console.log('Verifying material transaction...');

        const res = await client.query(`
            SELECT quantity, transaction_type, material_id
            FROM material_transactions
            WHERE project_id = $1 AND transaction_type = 'USAGE'
        `, [projectId]);

        if (res.rows.length === 0) {
            console.error('FAILED: No material transaction found.');
        } else {
            console.log('Transactions found:', res.rows.map(r => r.quantity));
            const quantities = res.rows.map(r => Number(r.quantity));

            if (quantities.includes(manualQty)) {
                console.log('SUCCESS: Found transaction with manual quantity ' + manualQty);
            } else {
                console.error(`FAILED: Expected quantity ${manualQty}, found ${quantities.join(', ')}`);
            }
        }

    } catch (error) {
        console.error('TEST FAILED:', error.response?.data || error.message);
        if (error.response?.data?.error) console.log('Details:', JSON.stringify(error.response.data.error, null, 2));
    } finally {
        if (client) await client.end();
    }
}

runTest();
