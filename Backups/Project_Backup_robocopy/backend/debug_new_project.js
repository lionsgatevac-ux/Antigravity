const { query } = require('./config/database');

async function debugNewProject() {
    try {
        const contractNumber = 'BOZSO-2025-0140';
        console.log(`Searching for project: ${contractNumber}`);

        const projectResult = await query(
            'SELECT id FROM projects WHERE contract_number = $1',
            [contractNumber]
        );

        if (projectResult.rows.length === 0) {
            console.log('Project not found by contract number.');
            return;
        }

        const projectId = projectResult.rows[0].id;
        console.log(`Project ID: ${projectId}`);

        const result = await query(
            `SELECT p.*, 
              pd.*, 
              c.full_name, c.id_number
       FROM projects p
       LEFT JOIN project_details pd ON p.id = pd.project_id
       LEFT JOIN customers c ON pd.customer_id = c.id
       WHERE p.id = $1`,
            [projectId]
        );

        const data = result.rows[0];
        console.log('--- Database Data ---');
        console.log('Full Name:', data.full_name);
        console.log('ID Number (id_number):', data.id_number);

        if (!data.id_number) {
            console.log('⚠️  WARNING: id_number is NULL or empty in the database!');
        } else {
            console.log('✅ id_number is present in the database:', data.id_number);
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debugNewProject();
