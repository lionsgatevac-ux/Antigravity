require('dotenv').config();
const { query } = require('./config/database');
const fs = require('fs');

// Use the token or ID from previous logs: 
// Project ID: 4917f727-c425-4d0e-9b36-aef737aa9125
// Token in URL seen in screenshots: 253fdc... (but might have changed)

const projectId = '4917f727-c425-4d0e-9b36-aef737aa9125';
const outputFile = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e637699e-a001-48b6-9711-b316a58c3e9e\\project_investigation.txt';

async function investigate() {
    try {
        let output = `Investigating Project: ${projectId}\n`;
        output += `Time: ${new Date().toISOString()}\n\n`;

        const result = await query('SELECT id, remote_signature_token, remote_signature_expires_at, customer_signed_at, LENGTH(customer_signature_data) as sig_len FROM projects WHERE id = $1', [projectId]);

        if (result.rows.length === 0) {
            output += "Project NOT FOUND in DB!\n";
        } else {
            const row = result.rows[0];
            output += "RAW DATA:\n";
            output += JSON.stringify(row, null, 2);
            output += "\n\nAnalysis:\n";
            output += `Token is NULL? ${row.remote_signature_token === null}\n`;
            output += `Signature Data Length: ${row.sig_len}\n`;
            output += `Signed At: ${row.customer_signed_at}\n`;
        }

        fs.writeFileSync(outputFile, output);
        console.log('Investigation complete. Output written.');
    } catch (err) {
        console.error(err);
        fs.writeFileSync(outputFile, `ERROR: ${err.message}`);
    } process.exit();
}

investigate();
