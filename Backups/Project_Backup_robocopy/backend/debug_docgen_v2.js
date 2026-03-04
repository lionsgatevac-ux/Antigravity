const fs = require('fs');
const logStream = fs.createWriteStream('debug_docgen.log');

console.log = function (message) {
    logStream.write(`LOG: ${message}\n`);
    process.stdout.write(`LOG: ${message}\n`);
};

console.error = function (message, stack) {
    logStream.write(`ERROR: ${message}\n`);
    if (stack) logStream.write(`STACK: ${stack}\n`);
    process.stderr.write(`ERROR: ${message}\n`);
};

try {
    console.log('Loading documentGenerator...');
    const docGen = require('./services/documentGenerator');
    console.log('documentGenerator loaded successfully!');
} catch (e) {
    console.error(e.message, e.stack);
}
