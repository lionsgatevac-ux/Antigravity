const http = require('http');

console.log('Testing /api/materials endpoint...');

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/materials',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('BODY:', data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
