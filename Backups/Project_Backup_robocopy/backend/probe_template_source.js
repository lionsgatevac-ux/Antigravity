const axios = require('axios'); // You might need to install axios or use fetch if node 18+
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/documents/generate';
const PROJECT_ID = '1'; // Assuming a project exists, or we might need to create one first.
// Actually, I can't easily rely on existing valid project IDs.
// But the route requires a project ID to fetch data.
// Is there a way to verify without DB data? No, the route fetches DB data.

// Let's rely on the fact that I can't easily fetch a valid ID blind.
// I'll assume the user has a project open or I'll try ID 1.
// BETTER: I'll use the projectId from the user's context if visible? No.
// I will try to use a valid ID or mock the DB call? I can't mock DB call of running server.

// Alternative: Verify the template file source first.
// I will Rename the template and see if local script breaks.

const templatePath = path.join(__dirname, '../templates/megallapodas_hem.docx');
const hiddenPath = path.join(__dirname, '../templates/megallapodas_hem_HIDDEN.docx');

try {
    if (fs.existsSync(templatePath)) {
        console.log(`Renaming ${templatePath} to ${hiddenPath}`);
        fs.renameSync(templatePath, hiddenPath);
    } else {
        console.log('Template already missing/renamed?');
    }
} catch (e) {
    console.error('Rename failed:', e);
}
