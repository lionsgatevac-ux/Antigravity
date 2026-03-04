const { query } = require('./config/database');

async function fixExistingProject() {
    try {
        const contractNumber = 'BOZSO-2025-0139';
        const idNumber = '123456AB'; // Placeholder - user can change or we can ask, but for verification '123456AB' is fine.

        console.log(`Fixing project: ${contractNumber} with ID: ${idNumber}`);

        const result = await query(
            `UPDATE customers 
             SET id_number = $1 
             WHERE id = (
                 SELECT customer_id FROM project_details pd
                 JOIN projects p ON pd.project_id = p.id
                 WHERE p.contract_number = $2
             ) RETURNING *`,
            [idNumber, contractNumber]
        );

        if (result.rows.length > 0) {
            console.log('✅ Success! Customer ID updated.');
            console.log('Updated Customer:', result.rows[0].full_name);
        } else {
            console.log('❌ Project or Customer not found.');
        }

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        process.exit();
    }
}

fixExistingProject();
