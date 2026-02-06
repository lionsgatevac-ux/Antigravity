try {
    console.log('Loading documentGenerator...');
    const docGen = require('./services/documentGenerator');
    console.log('documentGenerator loaded successfully!');
} catch (e) {
    console.error('CRITICAL ERROR loading documentGenerator:', e);
    console.error(e.stack);
}
