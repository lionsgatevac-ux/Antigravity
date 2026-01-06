const axios = require('axios');

// Configure base URL (assuming default port 5000)
const API_URL = 'http://localhost:3000/api';

const testDashboard = async () => {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@bozso.hu',
            password: 'password123'
        });

        const { token } = loginRes.data.data;
        console.log('   Login successful. Token obtained.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('3. Fetching Stats Overview...');
        const statsRes = await axios.get(`${API_URL}/stats/overview`, config);
        console.log('   Stats Overview:', JSON.stringify(statsRes.data));

        console.log('4. Fetching Monthly Stats...');
        const monthlyRes = await axios.get(`${API_URL}/stats/monthly`, config);
        console.log('   Monthly Stats:', monthlyRes.data.length, 'records found.');

        console.log('5. Fetching Projects...');
        const projectsRes = await axios.get(`${API_URL}/projects`, config);
        console.log('   Projects:', projectsRes.data.length, 'projects found.');

        console.log('✅ Dashboard Load Test Passed!');

    } catch (err) {
        console.error('❌ Error testing dashboard:');
        if (err.response) {
            console.error(`   Status: ${err.response.status}`);
            console.error(`   Data:`, err.response.data);
        } else {
            console.error(`   Message: ${err.message}`);
        }
    }
};

testDashboard();
