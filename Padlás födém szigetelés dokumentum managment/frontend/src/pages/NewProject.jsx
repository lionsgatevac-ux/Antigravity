import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, PenTool, Plus } from 'lucide-react';
import { projectsAPI, materialsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { calculateNetArea, calculateEnergySaving, calculateContractorFee, formatCurrency } from '../utils/calculations';
import { validateForm, required, email, phone, positiveNumber } from '../utils/validation';
import { getCityByZip, getZipByCity } from '../utils/addressUtils';
import './NewProject.css';

const NewProject = () => {
    const navigate = useNavigate();
    const { showToast, isOnline } = useApp();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        customer: {
            full_name: '',
            birth_name: '',
            mother_name: '',
            phone: '',
            email: '',
            address_postal_code: '',
            address_city: '',
            address_street: '',
            address_house_number: '',
            id_number: ''
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
            unheated_space_name: '',
            heating_type: 'gáz készülék'
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
            insulation_type: 'Thermowool Basic üveggyapot tekercs (0.039)',
            vapor_barrier_type: '',
            breathable_membrane_type: '',
            // Attic Declaration Init
            padlasfeljaro_szigetelese: 'NEM', // Default to NEM for 'attic_door_insulated' existing logic but matching UI
            // Note: DB column is 'attic_door_insulated'. We can map it or use it directly.
            // Let's stick to existing DB column 'attic_door_insulated' which is boolean. 
            // In UI 'IGEN'/'NEM' maps to true/false.
            attic_door_insulated: false, // Default false (NEM)
            // New fields
            pf_kivul_fodemen: false,
            pf_kivul_oromfal: false,
            pf_kivul_bonthato: false,
            pf_kivul_egyeb: false,
            pf_kivul_egyeb_szoveg: '',
            work_hour_start: '9',
            work_hour_end: '16',
            execution_date: '',
            manual_quantities: {
                insulation: '',
                vapor_barrier: '',
                breathable_membrane: ''
            }
        }
    });

    const [materialOptions, setMaterialOptions] = useState({
        insulation: [], // Empty initially, let API populate
        vapor_barrier: [],
        breathable_membrane: []
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isAddressSame, setIsAddressSame] = useState(formData.property.address_city === '' ||
        (formData.customer.address_city === formData.property.address_city &&
            formData.customer.address_street === formData.property.address_street));

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    // Fetch materials from API on component mount
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await materialsAPI.getAll();
                if (response.success && response.data) {
                    setMaterialOptions(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch materials:', error);
                showToast('Nem sikerült betölteni az anyagokat', 'error');
            }
        };
        fetchMaterials();
    }, []);

    const handleInputChange = (section, field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };

            // If it's a customer address field and sync is on, update property address too
            const addressFields = [
                'address_postal_code',
                'address_city',
                'address_street',
                'address_house_number'
            ];

            if (isAddressSame && section === 'customer' && addressFields.includes(field)) {
                newData.property = {
                    ...newData.property,
                    [field]: value
                };
            }

            return newData;
        });

        // Auto-fill city by postal code
        if (field === 'address_postal_code' && value.length === 4) {
            const detectedCity = getCityByZip(value);
            if (detectedCity) {
                setFormData(prev => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        address_city: detectedCity
                    }
                }));
                // If it's the customer postal code and sync is on, update everything
                if (isAddressSame && section === 'customer') {
                    setFormData(prev => ({
                        ...prev,
                        property: {
                            ...prev.property,
                            address_city: detectedCity,
                            address_postal_code: value
                        }
                    }));
                }
            }
        }

        // Auto-fill postal code by city
        if (field === 'address_city' && value.length > 2) {
            const detectedZip = getZipByCity(value);
            if (detectedZip) {
                setFormData(prev => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        address_postal_code: detectedZip
                    }
                }));
                // If it's the customer city and sync is on, update everything
                if (isAddressSame && section === 'customer') {
                    setFormData(prev => ({
                        ...prev,
                        property: {
                            ...prev.property,
                            address_city: value,
                            address_postal_code: detectedZip
                        }
                    }));
                }
            }
        }

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
                    energy_saving_gj: energySaving,
                    hem_value: String(Math.round(contractorFee))
                }
            }));
            setFormData(prev => ({
                ...prev,
                details: {
                    ...prev.details,
                    net_area: netArea,
                    net_amount: String(Math.round(contractorFee)),
                    energy_saving_gj: energySaving,
                    hem_value: String(Math.round(contractorFee))
                }
            }));
        }

        // Handle manual quantities update
        if (section === 'details' && field === 'manual_quantities') {
            setFormData(prev => ({
                ...prev,
                details: {
                    ...prev.details,
                    manual_quantities: value
                }
            }));
        }
    };

    const handleAddressSameChange = (e) => {
        const checked = e.target.checked;
        setIsAddressSame(checked);

        if (checked) {
            setFormData(prev => ({
                ...prev,
                property: {
                    ...prev.property,
                    address_postal_code: prev.customer.address_postal_code,
                    address_city: prev.customer.address_city,
                    address_street: prev.customer.address_street,
                    address_house_number: prev.customer.address_house_number
                }
            }));
        }
    };

    const addNewMaterialOption = async (category) => {
        const newValue = window.prompt(`Új ${category === 'insulation' ? 'szigetelőanyag' : 'fólia'} típus hozzáadása:`);
        if (newValue && newValue.trim()) {
            try {
                // Save to database
                // Use relative path or updated port
                const API_URL = import.meta.env.PROD ? '' : 'http://localhost:4000/api';
                const response = await materialsAPI.create({
                    category: category,
                    name: newValue.trim()
                });

                if (response.success) {
                    // Update local state
                    setMaterialOptions(prev => ({
                        ...prev,
                        [category]: [...prev[category], response.data] // Push full object
                    }));

                    // Auto-select the new value
                    const fieldMap = {
                        insulation: 'insulation_type',
                        vapor_barrier: 'vapor_barrier_type',
                        breathable_membrane: 'breathable_membrane_type'
                    };
                    handleInputChange('details', fieldMap[category], newValue.trim());
                    showToast('Anyag sikeresen hozzáadva!', 'success');
                } else {
                    showToast('Hiba az anyag mentésekor', 'error');
                }
            } catch (error) {
                console.error('Failed to save material:', error);
                if (error.message.includes('already exists')) {
                    showToast('Ez az anyag már létezik', 'warning');
                } else {
                    showToast('Hiba az anyag mentésekor', 'error');
                }
            }
        }
    };

    const validateStep = (stepNumber) => {
        let rules = {};

        if (stepNumber === 1) {
            rules = {
                'customer.full_name': [required],
                'customer.phone': [required, phone],
                'customer.email': [email]
            };
        } else if (stepNumber === 2) {
            rules = {
                'property.hrsz': [required],
                'property.building_year': [positiveNumber]
            };
        } else if (stepNumber === 3) {
            rules = {
                'details.gross_area': [required, positiveNumber],
                'details.net_amount': [required, positiveNumber]
            };
        }

        const flatData = {
            'customer.full_name': formData.customer.full_name,
            'customer.phone': formData.customer.phone,
            'customer.email': formData.customer.email,
            'property.hrsz': formData.property.hrsz,
            'property.building_year': formData.property.building_year,
            'details.gross_area': formData.details.gross_area,
            'details.net_amount': formData.details.net_amount
        };

        const validation = validateForm(flatData, rules);
        setErrors(validation.errors);
        return validation.isValid;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        } else {
            showToast('Kérjük, töltse ki a kötelező mezőket', 'error');
        }
    };

    const handlePrevious = () => {
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(step)) {
            showToast('Kérjük, töltse ki a kötelező mezőket', 'error');
            return;
        }
        await submitProject(formData);
    };

    const handleSaveDraft = async () => {
        // Create a copy of formData with placeholders for missing required fields
        const draftData = { ...formData };

        // 1. Customer placeholders
        if (!draftData.customer.full_name) draftData.customer.full_name = 'Névtelen Ügyfél (Vázlat)';
        if (!draftData.customer.phone) draftData.customer.phone = 'Nincs megadva';
        // Email is not strictly required by DB/Controller sanitization usually handles nulls, 
        // but if we have strict frontend validation rules we are bypassing them here.

        // 2. Property placeholders
        if (!draftData.property.hrsz) draftData.property.hrsz = 'VÁZLAT';
        // Other property fields are likely nullable or numeric sanitized to null by controller

        // 3. Details placeholders
        if (!draftData.details.gross_area) draftData.details.gross_area = '0';
        if (!draftData.details.net_amount) draftData.details.net_amount = '0';

        // Submit with draft flag (though controller defaults to draft, this ensures we proceed)
        await submitProject(draftData, true);
    };

    const submitProject = async (data, isDraft = false) => {
        try {
            setLoading(true);
            const response = await projectsAPI.create(data);
            console.log('Project creation response:', response);
            showToast(isDraft ? 'Vázlat sikeresen mentve!' : 'Projekt sikeresen létrehozva!', 'success');

            const projectId = response?.data?.id || response?.id || response?.data?.project?.id;
            if (projectId) {
                navigate(`/projects/${projectId}`);
            } else {
                console.error('Project ID missing in response:', response);
                showToast('Hiba: Nem sikerült a projekt azonosítóját lekérni', 'error');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || error.message || 'Hiba a mentés során';
            showToast(typeof errorMessage === 'string' ? errorMessage : 'Váratlan hiba történt', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fillTestData = () => {
        const randomNum = Math.floor(Math.random() * 1000);

        const gross = 100 + Math.floor(Math.random() * 50);
        const chimney = 1;
        const attic = 1.5;
        const other = 0;

        const netArea = calculateNetArea(gross, chimney, attic, other);
        const energySaving = calculateEnergySaving(netArea);
        const contractorFee = calculateContractorFee(energySaving);

        const testData = {
            customer: {
                full_name: `Teszt Elek ${randomNum}`,
                birth_name: `Teszt Elek ${randomNum}`,
                mother_name: 'Teszt Anyuka',
                phone: '06309876543',
                email: `teszt${randomNum}@pelda.hu`,
                address_postal_code: '1111',
                address_city: 'Budapest',
                address_street: 'Teszt utca',
                address_house_number: String(randomNum),
                id_number: '123456AB'
            },
            property: {
                address_postal_code: '1111',
                address_city: 'Budapest',
                address_street: 'Teszt utca',
                address_house_number: String(randomNum),
                hrsz: `1234/${randomNum}`,
                building_year: '1990',
                building_type: 'családi ház',
                structure_type: 'vasbeton',
                structure_thickness: '20',
                unheated_space_type: 'garázs',
                unheated_space_area: '25',
                unheated_space_name: ''
            },
            details: {
                gross_area: String(gross),
                chimney_area: String(chimney),
                attic_door_area: String(attic),
                other_deducted_area: String(other),
                net_area: netArea,
                net_amount: String(Math.round(contractorFee)),
                energy_saving_gj: energySaving,
                hem_value: String(Math.round(contractorFee)),
                insulation_type: 'Thermowool Basic üveggyapot tekercs (0.039)',
                vapor_barrier_type: '',
                breathable_membrane_type: ''
            }
        };

        setFormData(testData);
        showToast('✅ Teszt adatok betöltve!', 'success');
    };

    const renderStep = () => {
        // DEV: Teszt gomb megjelenítése minden lépésnél
        const TestButton = () => (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={fillTestData}
                    style={{
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    🧪 Teszt Adatok Kitöltése
                </button>
            </div>
        );

        switch (step) {
            case 1:
                return (
                    <div className="form-section">
                        <TestButton />
                        <h2>1. Ügyfél Adatok</h2>

                        <div className="form-group">
                            <label className="form-label">Teljes név *</label>
                            <input
                                type="text"
                                value={formData.customer.full_name}
                                onChange={(e) => handleInputChange('customer', 'full_name', e.target.value)}
                                className={errors['customer.full_name'] ? 'error' : ''}
                            />
                            {errors['customer.full_name'] && <span className="error-message">{errors['customer.full_name']}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Születési név</label>
                            <input
                                type="text"
                                value={formData.customer.birth_name}
                                onChange={(e) => handleInputChange('customer', 'birth_name', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Anyja neve</label>
                            <input
                                type="text"
                                value={formData.customer.mother_name}
                                onChange={(e) => handleInputChange('customer', 'mother_name', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Személyi igazolvány száma</label>
                            <input
                                type="text"
                                value={formData.customer.id_number}
                                onChange={(e) => handleInputChange('customer', 'id_number', e.target.value)}
                                placeholder="pl. 123456AB"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Telefon *</label>
                                <input
                                    type="tel"
                                    value={formData.customer.phone}
                                    onChange={(e) => handleInputChange('customer', 'phone', e.target.value)}
                                    className={errors['customer.phone'] ? 'error' : ''}
                                />
                                {errors['customer.phone'] && <span className="error-message">{errors['customer.phone']}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    value={formData.customer.email}
                                    onChange={(e) => handleInputChange('customer', 'email', e.target.value)}
                                    className={errors['customer.email'] ? 'error' : ''}
                                />
                                {errors['customer.email'] && <span className="error-message">{errors['customer.email']}</span>}
                            </div>
                        </div>

                        <h3>Lakcím</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Irányítószám</label>
                                <input
                                    type="text"
                                    value={formData.customer.address_postal_code}
                                    onChange={(e) => handleInputChange('customer', 'address_postal_code', e.target.value)}
                                    maxLength="4"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Város</label>
                                <input
                                    type="text"
                                    value={formData.customer.address_city}
                                    onChange={(e) => handleInputChange('customer', 'address_city', e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Utca</label>
                                <input
                                    type="text"
                                    value={formData.customer.address_street}
                                    onChange={(e) => handleInputChange('customer', 'address_street', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Házszám</label>
                                <input
                                    type="text"
                                    value={formData.customer.address_house_number}
                                    onChange={(e) => handleInputChange('customer', 'address_house_number', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="form-section">
                        <TestButton />
                        <h2>2. Ingatlan Adatok</h2>



                        <div className="form-group">
                            <label className="form-label">HRSZ *</label>
                            <input
                                type="text"
                                value={formData.property.hrsz}
                                onChange={(e) => handleInputChange('property', 'hrsz', e.target.value)}
                                className={errors['property.hrsz'] ? 'error' : ''}
                            />
                            {errors['property.hrsz'] && <span className="error-message">{errors['property.hrsz']}</span>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Építés éve</label>
                                <input
                                    type="number"
                                    value={formData.property.building_year}
                                    onChange={(e) => handleInputChange('property', 'building_year', e.target.value)}
                                    className={errors['property.building_year'] ? 'error' : ''}
                                />
                                {errors['property.building_year'] && <span className="error-message">{errors['property.building_year']}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Épület típusa</label>
                                <select
                                    value={formData.property.building_type}
                                    onChange={(e) => handleInputChange('property', 'building_type', e.target.value)}
                                >
                                    <option value="családi ház">Családi ház</option>
                                    <option value="sorház">Sorház</option>
                                    <option value="ikerház">Ikerház</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Födém szerkezet típusa</label>
                                <select
                                    value={formData.property.structure_type}
                                    onChange={(e) => handleInputChange('property', 'structure_type', e.target.value)}
                                >
                                    <option value="fa">Fa</option>
                                    <option value="acel">Acél gerendás</option>
                                    <option value="vasbeton">Vasbeton gerendás</option>
                                    <option value="monolit">Monolit vasbeton</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Szerkezet vastagság (cm)</label>
                                <input
                                    type="number"
                                    value={formData.property.structure_thickness}
                                    onChange={(e) => handleInputChange('property', 'structure_thickness', e.target.value)}
                                    placeholder="pl. 15"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Fűtetlen tér alatta</label>
                                <select
                                    value={formData.property.unheated_space_type}
                                    onChange={(e) => handleInputChange('property', 'unheated_space_type', e.target.value)}
                                >
                                    <option value="nincs">Nincs (Lakótér)</option>
                                    <option value="garázs">Garázs</option>
                                    <option value="télikert">Zárt naptér, átrium, télikert</option>
                                    <option value="egyéb">Egyéb</option>
                                </select>
                            </div>

                            {formData.property.unheated_space_type !== 'nincs' && (
                                <div className="form-group">
                                    <label className="form-label">Alapterület (m²)</label>
                                    <input
                                        type="number"
                                        value={formData.property.unheated_space_area}
                                        onChange={(e) => handleInputChange('property', 'unheated_space_area', e.target.value)}
                                    />
                                </div>
                            )}

                            {formData.property.unheated_space_type === 'egyéb' && (
                                <div className="form-group">
                                    <label className="form-label">Megnevezés</label>
                                    <input
                                        type="text"
                                        value={formData.property.unheated_space_name}
                                        onChange={(e) => handleInputChange('property', 'unheated_space_name', e.target.value)}
                                        placeholder="pl. tároló"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Az épület fűtésének típusa</label>
                            <select value={formData.property.heating_type} onChange={(e) => handleInputChange('property', 'heating_type', e.target.value)}>
                                <option value="gáz készülék">Gáz készülék</option>
                                <option value="vegyes tüzelés">Vegyes tüzelés</option>
                                <option value="fa fűtés">Fa fűtés</option>
                                <option value="elektromos fűtés">Elektromos fűtés</option>
                                <option value="klíma">Klíma</option>
                                <option value="hőszivattyú">Hőszivattyú</option>
                                <option value="egyéb">Egyéb</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Az épület fűtésének típusa</label>
                            <select value={formData.property.heating_type} onChange={(e) => handleInputChange('property', 'heating_type', e.target.value)}>
                                <option value="gáz készülék">Gáz készülék</option>
                                <option value="vegyes tüzelés">Vegyes tüzelés</option>
                                <option value="fa fűtés">Fa fűtés</option>
                                <option value="elektromos fűtés">Elektromos fűtés</option>
                                <option value="klíma">Klíma</option>
                                <option value="hőszivattyú">Hőszivattyú</option>
                                <option value="egyéb">Egyéb</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="isAddressSame"
                                checked={isAddressSame}
                                onChange={handleAddressSameChange}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <label htmlFor="isAddressSame" style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>
                                A beruházás címe megegyezik a lakcímmel
                            </label>
                        </div>

                        <h3>Ingatlan címe</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Irányítószám</label>
                                <input
                                    type="text"
                                    value={formData.property.address_postal_code}
                                    onChange={(e) => handleInputChange('property', 'address_postal_code', e.target.value)}
                                    maxLength="4"
                                    disabled={isAddressSame}
                                    className={isAddressSame ? 'disabled-input' : ''}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Város</label>
                                <input
                                    type="text"
                                    value={formData.property.address_city}
                                    onChange={(e) => handleInputChange('property', 'address_city', e.target.value)}
                                    disabled={isAddressSame}
                                    className={isAddressSame ? 'disabled-input' : ''}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Utca</label>
                                <input
                                    type="text"
                                    value={formData.property.address_street}
                                    onChange={(e) => handleInputChange('property', 'address_street', e.target.value)}
                                    disabled={isAddressSame}
                                    className={isAddressSame ? 'disabled-input' : ''}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Házszám</label>
                                <input
                                    type="text"
                                    value={formData.property.address_house_number}
                                    onChange={(e) => handleInputChange('property', 'address_house_number', e.target.value)}
                                    disabled={isAddressSame}
                                    className={isAddressSame ? 'disabled-input' : ''}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="form-section">
                        <TestButton />
                        <h2>3. Műszaki és Pénzügyi Adatok</h2>

                        <h3>Területek (m²)</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Bruttó terület *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.details.gross_area}
                                    onChange={(e) => handleInputChange('details', 'gross_area', e.target.value)}
                                    className={errors['details.gross_area'] ? 'error' : ''}
                                />
                                {errors['details.gross_area'] && <span className="error-message">{errors['details.gross_area']}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Kémény terület</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.details.chimney_area}
                                    onChange={(e) => handleInputChange('details', 'chimney_area', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Padlásfeljáró terület</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.details.attic_door_area}
                                    onChange={(e) => handleInputChange('details', 'attic_door_area', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Egyéb levonás</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.details.other_deducted_area}
                                    onChange={(e) => handleInputChange('details', 'other_deducted_area', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* --- NEW SECTION: Padlásfeljáró elhelyezkedése --- */}
                        <div className="section-divider" style={{ margin: '2rem 0', borderTop: '1px solid #e5e7eb' }}></div>
                        <h3>Padlásfeljáró elhelyezkedése</h3>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Hőszigetelt területen belül</label>
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                    Padlásfeljáró hőszigetelése megtörtént a fenti műszaki tartalommal?
                                </div>
                                <div className="attic-radio-group">
                                    <label className="attic-radio-label">
                                        <input
                                            type="radio"
                                            name="attic_door_insulated"
                                            checked={formData.details.attic_door_insulated === true}
                                            onChange={() => handleInputChange('details', 'attic_door_insulated', true)}
                                        />
                                        IGEN
                                    </label>
                                    <label className="attic-radio-label">
                                        <input
                                            type="radio"
                                            name="attic_door_insulated"
                                            checked={formData.details.attic_door_insulated === false}
                                            onChange={() => handleInputChange('details', 'attic_door_insulated', false)}
                                        />
                                        NEM
                                    </label>
                                </div>
                            </div>

                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Hőszigetelt területen kívül</label>
                                <div className="attic-checkbox-group">

                                    <label className="attic-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.details.pf_kivul_fodemen}
                                            onChange={(e) => handleInputChange('details', 'pf_kivul_fodemen', e.target.checked)}
                                        />
                                        <span>hőszigeteletlen födémen</span>
                                    </label>

                                    <label className="attic-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.details.pf_kivul_oromfal}
                                            onChange={(e) => handleInputChange('details', 'pf_kivul_oromfal', e.target.checked)}
                                        />
                                        <span>oromfal</span>
                                    </label>

                                    <label className="attic-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.details.pf_kivul_bonthato}
                                            onChange={(e) => handleInputChange('details', 'pf_kivul_bonthato', e.target.checked)}
                                        />
                                        <span>bontható tető</span>
                                    </label>

                                    <div className="attic-other-row">
                                        <label className="attic-checkbox-label" style={{ width: 'auto' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.details.pf_kivul_egyeb}
                                                onChange={(e) => handleInputChange('details', 'pf_kivul_egyeb', e.target.checked)}
                                            />
                                            <span>egyéb:</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="attic-other-input"
                                            value={formData.details.pf_kivul_egyeb_szoveg}
                                            onChange={(e) => handleInputChange('details', 'pf_kivul_egyeb_szoveg', e.target.value)}
                                            disabled={!formData.details.pf_kivul_egyeb}
                                            placeholder="..."
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>

                        <h3>Felhasznált anyagok típusa:</h3>

                        <div className="material-selection-row">
                            <label className="form-label">Párazáró fólia típusa:</label>
                            <div className="input-group">
                                <select
                                    value={formData.details.vapor_barrier_type}
                                    onChange={(e) => handleInputChange('details', 'vapor_barrier_type', e.target.value)}
                                >
                                    <option value="">Válasszon típust...</option>
                                    {materialOptions.vapor_barrier.map((opt, idx) => {
                                        const label = typeof opt === 'string' ? opt : String(opt.name || '');
                                        const val = typeof opt === 'string' ? opt : String(opt.name || '');
                                        return <option key={idx} value={val}>{label}</option>;
                                    })}

                                </select>
                                <button type="button" className="btn-icon-plus" onClick={() => addNewMaterialOption('vapor_barrier')}>
                                    <Plus size={20} />
                                </button>
                            </div>
                            {(() => {
                                const selected = materialOptions.vapor_barrier.find(m => (typeof m === 'string' ? m : m.name) === formData.details.vapor_barrier_type);
                                const needsManual = selected && (typeof selected === 'string' || !selected.coverage);

                                if (needsManual && formData.details.vapor_barrier_type) {
                                    return (
                                        <div className="mt-2">
                                            <label className="small text-muted">Mennyiség (tekercs):</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={formData.details.manual_quantities?.vapor_barrier || ''}
                                                onChange={(e) => handleInputChange('details', 'manual_quantities', { ...formData.details.manual_quantities, vapor_barrier: e.target.value })}
                                                placeholder="Kézi megadás..."
                                            />
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        <div className="material-selection-row">
                            <label className="form-label">Üveggyapot típusa:</label>
                            <div className="input-group">
                                <select
                                    value={formData.details.insulation_type}
                                    onChange={(e) => handleInputChange('details', 'insulation_type', e.target.value)}
                                >
                                    <option value="">Válasszon...</option>
                                    {materialOptions.insulation.map((opt, idx) => {
                                        const label = typeof opt === 'string' ? opt : String(opt.name || '');
                                        const val = typeof opt === 'string' ? opt : String(opt.name || '');
                                        return <option key={idx} value={val}>{label}</option>;
                                    })}

                                </select>
                                <button type="button" className="btn-icon-plus" onClick={() => addNewMaterialOption('insulation')}>
                                    <Plus size={20} />
                                </button>
                            </div>
                            {(() => {
                                const selected = materialOptions.insulation.find(m => (typeof m === 'string' ? m : m.name) === formData.details.insulation_type);
                                // Show manual input if selected exists AND (it's a string OR (object with no coverage))
                                const needsManual = selected && (typeof selected === 'string' || !selected.coverage);

                                if (needsManual && formData.details.insulation_type) {
                                    return (
                                        <div className="mt-2">
                                            <label className="small text-muted">Mennyiség (tekercs):</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={formData.details.manual_quantities?.insulation || ''}
                                                onChange={(e) => handleInputChange('details', 'manual_quantities', { ...formData.details.manual_quantities, insulation: e.target.value })}
                                                placeholder="Kézi megadás..."
                                            />
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        <div className="material-selection-row">
                            <label className="form-label">Pára áteresztő fólia:</label>
                            <div className="input-group">
                                <select
                                    value={formData.details.breathable_membrane_type}
                                    onChange={(e) => handleInputChange('details', 'breathable_membrane_type', e.target.value)}
                                >
                                    <option value="">Válasszon típust...</option>
                                    {materialOptions.breathable_membrane.map((opt, idx) => {
                                        const label = typeof opt === 'string' ? opt : String(opt.name || '');
                                        const val = typeof opt === 'string' ? opt : String(opt.name || '');
                                        return <option key={idx} value={val}>{label}</option>;
                                    })}

                                </select>
                                <button type="button" className="btn-icon-plus" onClick={() => addNewMaterialOption('breathable_membrane')}>
                                    <Plus size={20} />
                                </button>
                            </div>
                            {(() => {
                                const selected = materialOptions.breathable_membrane.find(m => (typeof m === 'string' ? m : m.name) === formData.details.breathable_membrane_type);
                                const needsManual = selected && (typeof selected === 'string' || !selected.coverage);

                                if (needsManual && formData.details.breathable_membrane_type) {
                                    return (
                                        <div className="mt-2">
                                            <label className="small text-muted">Mennyiség (tekercs):</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={formData.details.manual_quantities?.breathable_membrane || ''}
                                                onChange={(e) => handleInputChange('details', 'manual_quantities', { ...formData.details.manual_quantities, breathable_membrane: e.target.value })}
                                                placeholder="Kézi megadás..."
                                            />
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        <div className="section-divider" style={{ margin: '2rem 0', borderTop: '1px solid #e5e7eb' }}></div>
                        <h3>Időpontok:</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Kivitelezés dátuma</label>
                                <input
                                    type="date"
                                    value={formData.details.execution_date || (formData.customer.address_postal_code ? new Date().toISOString().split('T')[0] : '')}
                                    onChange={(e) => handleInputChange('details', 'execution_date', e.target.value)}
                                />
                                <small className="text-muted">Alapértelmezetten a szerződéskötés napja</small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Munka megkezdése (óra)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.details.work_hour_start}
                                    onChange={(e) => handleInputChange('details', 'work_hour_start', e.target.value)}
                                    placeholder="9"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Munka befejezése (óra)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.details.work_hour_end}
                                    onChange={(e) => handleInputChange('details', 'work_hour_end', e.target.value)}
                                    placeholder="16"
                                />
                            </div>
                        </div>

                        <div className="calculated-field">
                            <label className="form-label">Nettó szigetelt terület</label>
                            <div className="calculated-value">{formData.details.net_area} m²</div>
                        </div>

                        <div className="calculated-field">
                            <label className="form-label">Energiamegtakarítás</label>
                            <div className="calculated-value">
                                {calculateEnergySaving(formData.details.net_area)} GJ
                            </div>
                        </div>

                        <div className="calculated-field">
                            <label className="form-label">Ajánlott vállalkozói díj (számított)</label>
                            <div className="calculated-value">
                                {formatCurrency(calculateContractorFee(calculateEnergySaving(formData.details.net_area)))}
                            </div>
                            <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                                {calculateEnergySaving(formData.details.net_area)} GJ × 12,392 Ft/GJ
                            </small>
                        </div>

                        <h3>Pénzügyi</h3>
                        <div className="form-group">
                            <label className="form-label">Nettó vállalkozói díj (Ft) *</label>
                            <input
                                type="number"
                                value={formData.details.net_amount}
                                onChange={(e) => handleInputChange('details', 'net_amount', e.target.value)}
                                className={errors['details.net_amount'] ? 'error' : ''}
                                placeholder={calculateContractorFee(calculateEnergySaving(formData.details.net_area))}
                            />
                            {errors['details.net_amount'] && <span className="error-message">{errors['details.net_amount']}</span>}
                            <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                                A számított érték automatikusan kitölthető, vagy módosítható
                            </small>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="new-project">
            <div className="progress-bar">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Ügyfél</div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Ingatlan</div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Adatok</div>
            </div>

            <div className="form-container card">
                {renderStep()}

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="btn btn-secondary"
                        disabled={loading}
                        style={{ marginRight: 'auto', backgroundColor: '#6b7280', color: 'white', border: 'none' }}
                    >
                        {loading ? 'Mentés...' : '💾 Mentés Vázlatként'}
                    </button>

                    {step > 1 && (
                        <button onClick={handlePrevious} className="btn btn-secondary">
                            ← Vissza
                        </button>
                    )}

                    {step < 3 ? (
                        <button onClick={handleNext} className="btn btn-primary">
                            Tovább →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Mentés...' : '✓ Projekt Létrehozása'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewProject;
