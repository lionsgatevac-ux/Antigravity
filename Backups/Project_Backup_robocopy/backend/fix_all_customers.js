const { query } = require('./config/database');

async function fixAllCustomers() {
    try {
        console.log('Fixing all customers with empty id_number...');
        const result = await query(
            "UPDATE customers SET id_number = '123456AB' WHERE id_number IS NULL OR id_number = '' RETURNING *"
        );
        console.log(`✅ Updated ${result.rows.length} customers.`);
    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        process.exit();
    }
}

fixAllCustomers();
