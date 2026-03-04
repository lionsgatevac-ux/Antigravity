try {
    require('dotenv').config();
    const projectsRoute = require('./backend/routes/projects.js');
    console.log('✅ projects.js loaded successfully');
    process.exit(0);
} catch (error) {
    console.error('❌ Error loading projects.js:', error);
    process.exit(1);
}
