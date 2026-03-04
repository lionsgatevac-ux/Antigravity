const fs = require('fs');
try {
    const errorLog = fs.readFileSync('./backend/error.log', 'utf16le'); // Try utf16le first as it looked like it
    console.log(errorLog);
} catch (err) {
    console.log('Failed to read as utf16le, trying utf8');
    try {
        const errorLog = fs.readFileSync('./backend/error.log', 'utf8');
        console.log(errorLog);
    } catch (err2) {
        console.error('Failed to read error log:', err2);
    }
}
