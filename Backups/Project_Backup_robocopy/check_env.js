console.log("GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
const fs = require('fs');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        const stats = fs.statSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        console.log("Credential file exists:", !!stats);
    } catch (e) {
        console.log("Error checking credential file:", e.message);
    }
}
