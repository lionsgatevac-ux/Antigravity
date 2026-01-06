const { query } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function resetData() {
    try {
        console.log('🗑️  Deleting all project data...');

        // Delete in reverse order of dependency/creation
        await query('DELETE FROM photos');
        await query('DELETE FROM project_details');
        await query('DELETE FROM projects');
        await query('DELETE FROM customers');
        await query('DELETE FROM properties');

        console.log('✅ Database tables cleared (photos, project_details, projects, customers, properties).');

        // Clear directories
        const dirsToClean = [
            path.join(__dirname, 'generated'),
            path.join(__dirname, 'uploads')
        ];

        dirsToClean.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                let count = 0;
                files.forEach(file => {
                    // Skip .gitkeep if exists
                    if (file === '.gitkeep') return;

                    const filePath = path.join(dir, file);
                    try {
                        if (fs.lstatSync(filePath).isFile()) {
                            fs.unlinkSync(filePath);
                            count++;
                        }
                    } catch (e) {
                        console.error(`Failed to delete ${file}:`, e.message);
                    }
                });
                console.log(`✅ Cleared ${count} files from ${path.basename(dir)}`);
            } else {
                console.log(`ℹ️  Directory ${path.basename(dir)} does not exist.`);
            }
        });

        console.log('🎉 Reset complete! System is clean.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting data:', err);
        process.exit(1);
    }
}

resetData();
