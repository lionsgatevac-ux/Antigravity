require('dotenv').config();
const { query } = require('./config/database');
const fs = require('fs');
const path = require('path');

const projectId = '4917f727-c425-4d0e-9b36-aef737aa9125'; // From logs
const outputFile = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e637699e-a001-48b6-9711-b316a58c3e9e\\token_debug_output.txt';

async function checkProject() {
    try {
        let output = `Checking project: ${projectId}\n`;
        const result = await query('SELECT id, remote_signature_token, remote_signature_expires_at, NOW() as server_time FROM projects WHERE id = $1', [projectId]);

        if (result.rows.length === 0) {
            output += 'Project not found\n';
        } else {
            const row = result.rows[0];
            const token = row.remote_signature_token;
            const expiry = new Date(row.remote_signature_expires_at);
            const now = new Date(row.server_time);

            output += `Token: ${token || 'NULL'}\n`;
            // Log hex dump of token if exists
            if (token) {
                output += `Token Bytes: ${Buffer.from(token).toString('hex')}\n`;
            }
            output += `Expires: ${expiry.toISOString()}\n`;
            output += `Server Time: ${now.toISOString()}\n`;
            output += `Is Expired?: ${expiry <= now}\n`;
        }
        fs.writeFileSync(outputFile, output);
        console.log('Done writing to file');
    } catch (err) {
        fs.writeFileSync(outputFile, `Error: ${err.message}`);
        console.error(err);
    } finally {
        process.exit();
    }
}

checkProject();
