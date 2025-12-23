const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'NewProject.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and fix the broken formData state
const brokenStatePattern = /const \[formData, setFormData\] = useState\(\{[\s\S]*?const validateStep/;

const fixedState = `const [formData, setFormData] = useState({
        customer: {
            full_name: '',
            birth_name: '',
            mother_name: '',
            phone: '',
            email: '',
            address_postal_code: '',
            address_city: '',
            address_street: '',
            address_house_number: ''
        },
        property: {
            address_postal_code: '',
            address_city: '',
            address_street: '',
            address_house_number: '',
            hrsz: '',
            building_year: '',
            building_type: 'családi ház',
            structure_type: 'fa',
            structure_thickness: '',
            unheated_space_type: 'nincs',
            unheated_space_area: '',
            unheated_space_name: ''
        },
        details: {
            gross_area: '',
            chimney_area: '0',
            attic_door_area: '0',
            other_deducted_area: '0',
            net_area: '0',
            net_amount: '',
            energy_saving_gj: '0',
            labor_cost: '0',
            hem_value: '0',
            government_support: '0',
            insulation_type: 'Üveggyapot',
            foil_type: 'Párazáró fólia'
        }
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));

        // Auto-calculate net area and contractor fee
        if (section === 'details' && ['gross_area', 'chimney_area', 'attic_door_area', 'other_deducted_area'].includes(field)) {
            const { gross_area, chimney_area, attic_door_area, other_deducted_area } = {
                ...formData.details,
                [field]: value
            };
            const netArea = calculateNetArea(gross_area, chimney_area, attic_door_area, other_deducted_area);
            const energySaving = calculateEnergySaving(netArea);
            const contractorFee = calculateContractorFee(energySaving);

            setFormData(prev => ({
                ...prev,
                details: {
                    ...prev.details,
                    net_area: netArea,
                    net_amount: String(Math.round(contractorFee)),
                    energy_saving_gj: energySaving
                }
            }));
        }
    };

    const validateStep`;

content = content.replace(brokenStatePattern, fixedState);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ NewProject.jsx restored successfully');
