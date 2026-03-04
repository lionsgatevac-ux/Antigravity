const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // Database errors
    if (err.code === '23505') { // Unique constraint violation
        statusCode = 409;
        message = 'Resource already exists';
    }

    if (err.code === '23503') { // Foreign key violation
        statusCode = 400;
        message = 'Referenced resource does not exist';
    }

    // Send error response
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '..', 'backend_error.json');
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: message,
            stack: err.stack,
            type: err.name || 'UNKNOWN_ERROR',
            url: req.originalUrl,
            method: req.method
        };
        fs.writeFileSync(logPath, JSON.stringify(errorLog, null, 2));
    } catch (e) {
        console.error('Failed to write error log:', e);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler;
