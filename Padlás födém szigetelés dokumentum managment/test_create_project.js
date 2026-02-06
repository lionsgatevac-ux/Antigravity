const axios = require('axios');

async function testCreateProject() {
    const API_URL = 'http://localhost:3000/api';

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@bozso.hu', // Using the valid remote user
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Login successful. Token obtained from data.data.token');

        // 2. Create Project with new fields
        console.log('Creating project with new attic fields...');
        const projectData = {
            customer: {
                full_name: 'Test Customer Attic',
                birth_name: 'Test Birth',
                mother_name: 'Test Mother',
                phone: '+36301234567',
                email: 'test@attic.com',
                address_postal_code: '1234',
                address_city: 'Test City',
                address_street: 'Test Street',
                address_house_number: '1',
                id_number: '123456AA'
            },
            property: {
                address_postal_code: '1234',
                address_city: 'Test City',
                address_street: 'Test Street',
                address_house_number: '1',
                hrsz: '123/45',
                building_year: '2000',
                building_type: 'családi ház',
                structure_type: 'fa',
                structure_thickness: '20',
                unheated_space_type: 'nincs',
                unheated_space_area: '',
                unheated_space_name: '',
                heating_type: 'gáz készülék'
            },
            details: {
                gross_area: '100',
                chimney_area: '1',
                attic_door_area: '2',
                other_deducted_area: '0',
                net_area: '97',
                net_amount: '100000',
                energy_saving_gj: '5',
                labor_cost: '50000',
                hem_value: '5',
                government_support: '0',
                insulation_type: 'Test Insulation',
                vapor_barrier_type: 'Test Vapor',
                breathable_membrane_type: 'Test Membrane',
                // NEW FIELDS
                pf_kivul_fodemen: true,
                pf_kivul_oromfal: false,
                pf_kivul_bonthato: true,
                pf_kivul_egyeb: true,
                pf_kivul_egyeb_szoveg: 'Teszt egyeb szoveg'
            }
        };

        const createRes = await axios.post(`${API_URL}/projects`, projectData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (createRes.data.success) {
            console.log('Project created successfully!');
            console.log('Project ID:', createRes.data.data.project.id);
            // Verify returned data structure if possible, but success implies DB insert worked
            console.log('Verifying response contains new fields...');

            const detailRes = await axios.get(`${API_URL}/projects/${createRes.data.data.project.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const savedDetails = detailRes.data;
            const fs = require('fs');
            fs.writeFileSync('response.json', JSON.stringify(savedDetails, null, 2));
            console.log('Written response.json');

            console.log('Saved pf_kivul_fodemen:', savedDetails.pf_kivul_fodemen);
            console.log('Saved pf_kivul_bonthato:', savedDetails.pf_kivul_bonthato);
            console.log('Saved pf_kivul_egyeb_szoveg:', savedDetails.pf_kivul_egyeb_szoveg);

            if (savedDetails.pf_kivul_fodemen === true &&
                savedDetails.pf_kivul_egyeb_szoveg === 'Teszt egyeb szoveg') {
                console.log('✅ Verification PASSED: New fields are saved correctly.');
            } else {
                console.error('❌ Verification FAILED: Fields not saved correctly.');
            }

        } else {
            console.error('Project creation failed:', createRes.data);
        }

    } catch (error) {
        console.error('Test failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        if (error.response?.status === 401) {
            console.log('401 Error detected. Token might be invalid or user not found.');
        }
    }
}

testCreateProject();
