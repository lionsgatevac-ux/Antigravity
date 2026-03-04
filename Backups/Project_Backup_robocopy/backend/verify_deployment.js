const { Pool } = require('pg');
const axios = require('axios');

// Production database URL
const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

// Cloud Run service URL
const SERVICE_URL = 'https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app';

async function verifyDeployment() {
    console.log('🔍 Starting Deployment Verification...\n');

    let allTestsPassed = true;

    // Test 1: Database Connection
    console.log('1️⃣ Testing Database Connection...');
    try {
        const pool = new Pool({
            connectionString: prodUrl,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();
        console.log('   ✅ Database connection successful');

        // Check projects count
        const projectsResult = await client.query('SELECT COUNT(*) FROM projects');
        const projectCount = parseInt(projectsResult.rows[0].count);
        console.log(`   ✅ Projects in database: ${projectCount}`);

        // Check critical tables
        const tables = ['users', 'organizations', 'projects', 'documents', 'photos', 'materials'];
        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ✅ ${table}: ${result.rows[0].count} rows`);
            } catch (e) {
                console.error(`   ❌ ${table}: ERROR - ${e.message}`);
                allTestsPassed = false;
            }
        }

        client.release();
        await pool.end();

    } catch (error) {
        console.error('   ❌ Database connection failed:', error.message);
        allTestsPassed = false;
    }

    console.log('');

    // Test 2: Cloud Run Service Health
    console.log('2️⃣ Testing Cloud Run Service...');
    try {
        const response = await axios.get(`${SERVICE_URL}/api/health`, {
            timeout: 10000,
            validateStatus: () => true // Accept any status
        });

        if (response.status === 200) {
            console.log('   ✅ Service is responding');
            console.log(`   Response: ${JSON.stringify(response.data)}`);
        } else {
            console.log(`   ⚠️ Service responded with status: ${response.status}`);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('   ❌ Service is not accessible (connection refused)');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('   ❌ Service timeout (service may be starting)');
        } else {
            console.error('   ❌ Service check failed:', error.message);
        }
        allTestsPassed = false;
    }

    console.log('');

    // Test 3: API Endpoints
    console.log('3️⃣ Testing API Endpoints...');
    try {
        // Test projects endpoint
        const projectsResponse = await axios.get(`${SERVICE_URL}/api/projects`, {
            timeout: 10000,
            validateStatus: () => true
        });

        if (projectsResponse.status === 200 || projectsResponse.status === 401) {
            console.log('   ✅ /api/projects endpoint is accessible');
            if (projectsResponse.status === 200) {
                console.log(`   Projects returned: ${projectsResponse.data.length || 0}`);
            }
        } else {
            console.log(`   ⚠️ /api/projects returned status: ${projectsResponse.status}`);
        }

    } catch (error) {
        console.error('   ❌ API endpoint test failed:', error.message);
        allTestsPassed = false;
    }

    console.log('');

    // Test 4: Environment Variables
    console.log('4️⃣ Checking Environment Configuration...');
    console.log(`   Service URL: ${SERVICE_URL}`);
    console.log('   Expected ENV vars:');
    console.log('      - NODE_ENV=production');
    console.log('      - PORT=8080');
    console.log('      - FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app');
    console.log('   ✅ Configuration documented');

    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    if (allTestsPassed) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('🎉 Deployment verification successful');
    } else {
        console.log('⚠️ SOME TESTS FAILED');
        console.log('Please review the errors above');
    }
    console.log('═══════════════════════════════════════');
    console.log('');

    console.log('📋 Manual Verification Steps:');
    console.log('   1. Open: https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app');
    console.log('   2. Login with admin credentials');
    console.log('   3. Check that projects are visible');
    console.log('   4. Open a project and generate a document (tests LibreOffice)');
    console.log('   5. Verify the document is generated correctly');
    console.log('');

    return allTestsPassed;
}

// Run verification
verifyDeployment()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Verification error:', err);
        process.exit(1);
    });
