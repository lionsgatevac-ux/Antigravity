// Server restart trigger v3 - DEBUG NO EXIT
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');


// Load environment variables
dotenv.config();

// Import routes
const projectRoutes = require('./routes/projects');
const publicRoutes = require('./routes/public');
const customerRoutes = require('./routes/customers');
const documentRoutes = require('./routes/documents');
const uploadRoutes = require('./routes/uploads');
const statsRoutes = require('./routes/stats');
const remoteRoutes = require('./routes/remote');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: true,
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
app.use('/api/projects', projectRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/customers', require('./routes/customers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/remote', require('./routes/remote'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/inventory', require('./routes/inventory'));

// Health check
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
        environment: process.env.NODE_ENV,
        has_jwt: !!process.env.JWT_SECRET
    });
});

app.get('/api/version', (req, res) => {
    res.json({
        version: '2.3',
        timestamp: new Date().toISOString(),
        note: 'Debug Env + No Exit'
    });
});

// All other routes serve index.html (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server
console.log('[Server] Starting application...');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`DEBUG: JWT_SECRET presence: ${!!process.env.JWT_SECRET}`);
    console.log(`DEBUG: Available keys: ${Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET')).join(', ')}`);

    // Removed process.exit(1) to debug
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        console.error('WARNING: JWT_SECRET is missing in PRODUCTION but NOT exiting (DEBUG MODE)');
    }

    const db = require('./config/database');
    db.query('SELECT NOW()')
        .then(result => {
            console.log('Database connected successfully at:', result.rows[0].now);
        })
        .catch(err => {
            console.error('Database connection FAILED:', err.message);
        });
});

module.exports = app;
