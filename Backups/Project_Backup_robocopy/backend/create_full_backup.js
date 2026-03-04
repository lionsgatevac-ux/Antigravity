const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Production Supabase connection
const prodUrl = 'postgresql://postgres:Bizniszmatek@db.pkjohziwbiiyzyospuot.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

// All tables to backup
const TABLES = [
    'users',
    'organizations',
    'projects',
    'documents',
    'invitations',
    'photos',
    'materials',
    'project_materials'
];

async function createFullBackup() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting FULL Production Backup...\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, 'backups');

        // Create backups directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            console.log('📁 Created backups directory');
        }

        const backupData = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '2.6',
                database: 'production_supabase',
                tables: {}
            },
            data: {}
        };

        // Backup each table
        for (const table of TABLES) {
            console.log(`📦 Backing up table: ${table}...`);
            try {
                const res = await client.query(`SELECT * FROM ${table}`);
                backupData.data[table] = res.rows;
                backupData.metadata.tables[table] = {
                    rowCount: res.rows.length,
                    columns: res.fields.map(f => f.name)
                };
                console.log(`   ✅ ${table}: ${res.rows.length} rows`);
            } catch (e) {
                console.warn(`   ⚠️ Could not backup table ${table}:`, e.message);
                backupData.metadata.tables[table] = {
                    error: e.message
                };
            }
        }

        // Save backup file
        const filename = path.join(backupDir, `full_backup_${timestamp}.json`);
        fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

        console.log('\n✅ BACKUP COMPLETED SUCCESSFULLY!');
        console.log(`📄 Backup file: ${filename}`);
        console.log('\n📊 Backup Summary:');

        for (const [table, info] of Object.entries(backupData.metadata.tables)) {
            if (info.rowCount !== undefined) {
                console.log(`   ${table}: ${info.rowCount} rows`);
            } else {
                console.log(`   ${table}: ERROR - ${info.error}`);
            }
        }

        // Calculate total size
        const stats = fs.statSync(filename);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\n💾 Backup file size: ${fileSizeMB} MB`);

        return filename;

    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run backup
createFullBackup()
    .then(filename => {
        console.log('\n🎉 Backup process completed!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n💥 Backup process failed:', err);
        process.exit(1);
    });
