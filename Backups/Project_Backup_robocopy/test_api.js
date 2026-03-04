// Test direct API call for project creation  
async function testProjectCreation() {
    const testData = {
        customer: {
            full_name: "API Test User",
            phone: "06301111111",
            email: "test@api.com",
            address_postal_code: "1111",
            address_city: "Budapest",
            address_street: "Test utca",
            address_house_number: "1"
        },
        property: {
            address_postal_code: "1111",
            address_city: "Budapest",
            address_street: "Test utca",
            address_house_number: "1",
            hrsz: "1234/5",
            building_year: "2000",
            building_type: "családi ház",
            structure_type: "fa",
            structure_thickness: 20,
            unheated_space_type: "nincs",
            unheated_space_area: 0,
            unheated_space_name: ""
        },
        details: {
            gross_area: 100,
            chimney_area: 1,
            attic_door_area: 1.5,
            other_deducted_area: 0,
            net_area: 97.5,
            net_amount: 500000
        }
    };

    console.log('🧪 Testing Project Creation API...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    try {
        const response = await fetch('http://localhost:3000/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('\n📊 Response Status:', response.status);

        const responseText = await response.text();
        console.log('\n📝 Response Body:', responseText);

        if (!response.ok) {
            console.error('\n❌ API Error!');
            return false;
        }

        console.log('\n✅ API Success!');
        return true;

    } catch (error) {
        console.error('\n❌ Network Error:', error.message);
        return false;
    }
}

testProjectCreation();
