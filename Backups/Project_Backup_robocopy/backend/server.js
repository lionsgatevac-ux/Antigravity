// Server restart trigger v2
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const projectRoutes = require('./routes/projects');
const customerRoutes = require('./routes/customers');
const documentRoutes = require('./routes/documents');
const uploadRoutes = require('./routes/uploads');
const statsRoutes = require('./routes/stats');
const remoteRoutes = require('./routes/remote');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins including same-origin
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generated', express.static(path.join(__dirname, 'generated'), {
    setHeaders: (res, filePath) => {
        const fileName = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        // CRITICAL: Disable ALL caching to ensure fresh files are always served
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects')); // Protection inside routes or here?
app.use('/api/customers', require('./routes/customers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/remote', require('./routes/remote'));
app.use('/api/materials', require('./routes/materials'));

// Health check
// DEBUG ROUTE for Database Connection (Placed here to avoid wildcard shadowing)
app.get('/api/debug-db', async (req, res) => {
    const db = require('./config/database');
    try {
        const result = await db.query('SELECT NOW() as time, current_user, current_database()');
        res.json({
            status: 'OK',
            message: 'Database connection success',
            data: result.rows[0],
            env: {
                node_env: process.env.NODE_ENV,
                has_db_url: !!process.env.DATABASE_URL
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: err.message,
            stack: err.stack,
            env: {
                node_env: process.env.NODE_ENV,
                has_db_url: !!process.env.DATABASE_URL
            }
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('/api/version', (req, res) => {
    res.json({
        version: '2.1',
        timestamp: new Date().toISOString(),
        note: 'SignaturePad + New Doc Type'
    });
});

// All other routes serve index.html (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
console.log(`[Server] Starting application...`);
console.log(`[Server] Port configured as: ${PORT}`);



app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT} (v2.2 - Production)`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

    // Verify database connection on startup
    const db = require('./config/database');

    // DEBUG: Check static files
    const fs = require('fs');
    const frontendPath = path.join(__dirname, '../frontend/dist');
    const indexPath = path.join(frontendPath, 'index.html');

    console.log('🔍 DEBUG: Current __dirname:', __dirname);
    console.log('🔍 DEBUG: Target frontend path:', frontendPath);

    try {
        if (fs.existsSync(frontendPath)) {
            console.log('✅ Frontend dist folder exists');
            const files = fs.readdirSync(frontendPath);
            console.log('📂 Files in dist:', files);
        } else {
            console.error('❌ Frontend dist folder MISSING at:', frontendPath);
        }

        if (fs.existsSync(indexPath)) {
            console.log('✅ index.html found');
        } else {
            console.error('❌ index.html MISSING');
        }
    } catch (err) {
        console.error('❌ filesystem check error:', err);
    }

    db.query('SELECT NOW()')
        .then(result => {
            console.log('✅ Database connected successfully at:', result.rows[0].now);
        })
        .catch(err => {
            console.error('❌ Database connection FAILED:', err.message);
        });
});

module.exports = app;
