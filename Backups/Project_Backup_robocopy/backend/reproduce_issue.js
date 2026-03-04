

const testData = {
    customer: {
        full_name: 'Teszt Elek Reproduce',
        birth_name: 'Teszt Elek Reproduce',
        mother_name: 'Teszt Anyuka',
        phone: '06309876543',
        email: 'reproduce@pelda.hu',
        address_postal_code: '1111',
        address_city: 'Budapest',
        address_street: 'Teszt utca',
        address_house_number: '123'
    },
    property: {
        address_postal_code: '1111',
        address_city: 'Budapest',
        address_street: 'Teszt utca',
        address_house_number: '123',
        hrsz: '1234/Rep',
        building_year: '1990',
        building_type: 'családi ház',
        structure_type: 'vasbeton',
        structure_thickness: '20',
        unheated_space_type: 'garázs',
        unheated_space_area: '25',
        unheated_space_name: ''
    },
    details: {
        gross_area: '120',
        chimney_area: '1',
        attic_door_area: '1.5',
        other_deducted_area: '0',
        net_area: '117.5',
        net_amount: '1000000'
    }
};

async function reproduce() {
    try {
        console.log('Sending request...');
        const response = await fetch('http://localhost:3000/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Success:', data);
        } else {
            console.error('Error Status:', response.status);
            console.error('Error Data:', data);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}


reproduce();
