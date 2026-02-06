const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const SERVICE_URL = 'https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app';

async function verify() {
    let client;
    try {
        console.log('🔍 Getting a project with floor plan...');
        client = await pool.connect();
        const res = await client.query(`
            SELECT project_id FROM photos 
            WHERE photo_type = 'floor_plan' AND file_url IS NOT NULL 
            ORDER BY taken_at DESC LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.log('❌ No suitable project found.');
            return;
        }

        const projectId = res.rows[0].project_id;
        console.log(`✅ Found Project ID: ${projectId}`);

        console.log('🚀 Triggering document generation...');
        try {
            const response = await axios.post(`${SERVICE_URL}/api/documents/generate`, {
                projectId: projectId,
                documentType: 'kivitelezoi_nyilatkozat'
            });

            if (response.data.success) {
                console.log('✅ Document generated successfully!');
                console.log(`📄 URL: ${SERVICE_URL}${response.data.data.fileUrl}`);
                console.log('🎉 FIX VERIFIED! (If no errors in logs)');
            } else {
                console.error('❌ Generation failed:', response.data);
            }
        } catch (apiErr) {
            console.error('❌ API Request failed:', apiErr.message);
            if (apiErr.response) {
                console.error('   Status:', apiErr.response.status);
                console.error('   Data:', apiErr.response.data);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

verify();
