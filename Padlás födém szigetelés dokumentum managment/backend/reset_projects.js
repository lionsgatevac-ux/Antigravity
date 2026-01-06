const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function resetProjects() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Deleting all projects...');

        // Delete all projects (cascades to related data)
        const result = await client.query('DELETE FROM projects');
        console.log(`✅ Deleted ${result.rowCount} projects and all related data`);

        console.log('\n✨ Database cleanup completed successfully!');
        console.log('📝 Note: Next contract number will start from current year/1');

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

resetProjects().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
