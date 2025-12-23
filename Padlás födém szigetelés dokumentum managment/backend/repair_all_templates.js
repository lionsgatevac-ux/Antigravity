const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const templates = [
    'kivitelezesi_szerzodes.docx',
    'atadas_atveteli.docx',
    'kivitelezoi_nyilatkozat.docx',
    'megallapodas_hem.docx'
];

templates.forEach(t => {
    const fullPath = path.join(__dirname, '../templates', t);
    if (!fs.existsSync(fullPath)) return;

    console.log(`Repairing ${t}...`);
    try {
        // I'll use the existing repair_fractured_tags.js script if I can adjust it or just run it with arguments
        // But since I don't know if it takes args, I'll check its content first or just use its logic
        execSync(`node repair_fractured_tags.js "${fullPath}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to repair ${t}:`, e.message);
    }
});
