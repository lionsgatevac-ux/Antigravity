const fs = require('fs');
const path = require('path');

const items = ['package-lock.json', 'node_modules'];

items.forEach(item => {
    const targetPath = path.join(__dirname, item);
    if (fs.existsSync(targetPath)) {
        console.log(`Deleting ${targetPath}...`);
        try {
            fs.rmSync(targetPath, { recursive: true, force: true });
            console.log(`Successfully deleted ${targetPath}`);
        } catch (err) {
            console.error(`Error deleting ${targetPath}:`, err.message);
        }
    } else {
        console.log(`${targetPath} does not exist, skipping.`);
    }
});
