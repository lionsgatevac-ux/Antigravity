require('dotenv').config({ path: '.env.prod_test' });
console.log('Testing Supabase Init...');
try {
    const service = require('./backend/services/supabaseStorage');
    console.log('Service required successfully');
    console.log('Supabase instance:', !!service.supabase);
} catch (e) {
    console.error('CRASHED:', e);
}
