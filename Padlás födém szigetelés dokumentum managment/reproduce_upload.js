const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    try {
        const projectId = 'bdde1036-9b6a-42b6-b811-e0e8c6457860'; // From user screenshot
        const form = new FormData();
        form.append('projectId', projectId);
        form.append('photoType', 'floor_plan');

        // Create a dummy image
        const buffer = Buffer.from('fake image data', 'utf-8');
        form.append('photo', buffer, { filename: 'test_floor_plan.png', contentType: 'image/png' });

        console.log('Sending request to http://localhost:3000/api/uploads/photo...');
        const response = await axios.post('http://localhost:3000/api/uploads/photo', form, {
            headers: {
                ...form.getHeaders()
            },
            validateStatus: () => true // Accept all status codes to see error
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testUpload();
