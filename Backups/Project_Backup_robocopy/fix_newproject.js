const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'NewProject.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the broken handleInputChange function
const brokenPattern = /details: \{[\s\S]*?}\)\);[\s\S]*?const newEnergySaving[\s\S]*?}\)\);/;
const fixedCode = `setFormData(prev => ({
                ...prev,
                details: {
                    ...prev.details,
                    net_area: netArea,
                    net_amount: String(Math.round(contractorFee)),
                    energy_saving_gj: energySaving
                }
            }));`;

content = content.replace(brokenPattern, fixedCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed NewProject.jsx');
