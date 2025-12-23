// Native fetch is used 
// Actually, user environment might not have node-fetch installed if I don't see it in package.json.
// The previous verify script removed node-fetch, so I should use native fetch or check.
// I'll use native fetch wrapped in try-catch/check.

async function verifyFlow() {
    const baseUrl = 'http://localhost:3000/api';

    const testProject = {
        customer: {
            full_name: "Teszt Géza",
            phone: "06301234567",
            email: "teszt@geza.hu",
            address_postal_code: "1234",
            address_city: "Budapest",
            address_street: "Próba utca",
            address_house_number: "42"
        },
        property: {
            address_postal_code: "1234",
            address_city: "Budapest",
            address_street: "Próba utca",
            address_house_number: "42",
            hrsz: "1234/56",
            building_year: "1985",
            building_type: "családi ház",
            structure_type: "acel", // Teszteljük az 'acel' típust
            structure_thickness: 30, // Teszt adat
            unheated_space_type: "garázs", // FIXED: using accented character
            unheated_space_area: 15,
            unheated_space_name: ""
        },
        details: {
            gross_area: 100,
            net_area: 80,
            net_amount: 500000
        }
    };

    try {
        console.log('1. Creating Project...');
        const createRes = await fetch(`${baseUrl}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testProject)
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create Project failed: ${createRes.status} ${err}`);
        }

        const projectData = await createRes.json();
        const projectId = projectData.data.project.id;
        console.log('✅ Project created. ID:', projectId);

        console.log('2. Generating Kivitelezői Nyilatkozat...');
        const docRes = await fetch(`${baseUrl}/documents/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: projectId,
                documentType: 'kivitelezoi_nyilatkozat'
            })
        });

        if (!docRes.ok) {
            const err = await docRes.text();
            throw new Error(`Generate Document failed: ${docRes.status} ${err}`);
        }

        const docData = await docRes.json();
        console.log('✅ Document generated:', docData);

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyFlow();
