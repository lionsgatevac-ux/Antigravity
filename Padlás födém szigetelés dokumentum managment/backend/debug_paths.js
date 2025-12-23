const path = require('path');

console.log('Current directory:', __dirname);
console.log('Parent 1:', path.join(__dirname, '..'));
console.log('Parent 2:', path.join(__dirname, '..', '..'));
console.log('Templates dir:', path.join(__dirname, '..', '..', 'templates'));
console.log('Megallapodas hem:', path.join(__dirname, '..', '..', 'templates', 'megallapodas_hem.docx'));

// Also check from services folder perspective
const servicesDir = path.join(__dirname, '..', 'services');
console.log('\nFrom services folder:');
console.log('Services__dirname would be:', servicesDir);
console.log('Templates from there:', path.join(servicesDir, '..', '..', 'templates'));
