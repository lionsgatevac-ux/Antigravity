const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Biznisz%20matek@localhost:5432/bozso_db'
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('customers', 'properties', 'projects', 'project_details')
      ORDER BY table_name, ordinal_position;
    `);
    
    const tables = {};
    res.rows.forEach(row => {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(row.column_name);
    });
    
    console.log('Schema:', JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await pool.end();
  }
}

checkSchema();
