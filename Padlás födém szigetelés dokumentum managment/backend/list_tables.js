const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://postgres:Biznisz%20matek@localhost:5432/bozso_db' });
p.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
    .then(r => { r.rows.forEach(row => console.log(row.tablename)); p.end(); })
    .catch(e => { console.log('ERR:', e.message); p.end(); });
