import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { CheckCircle, Save, Plus, ArrowLeft, PenTool } from 'lucide-react';
import { projectsAPI, materialsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { calculateNetArea, calculateEnergySaving, calculateContractorFee, formatCurrency } from '../utils/calculations';
import { validateForm, required, email, phone, positiveNumber } from '../utils/validation';
import { getCityByZip, getZipByCity } from '../utils/addressUtils';
import FloorPlanModal from '../components/FloorPlanModal';
import './NewProject.css'; // Reuse styles

const EditProject = () => {
    // console.log('EditProject component loaded');

    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);

    // Initial state matching NewProject structure
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
            attic_door_insulated: false,
            pf_kivul_fodemen: false,
            pf_kivul_oromfal: false,
            pf_kivul_bonthato: false,
            pf_kivul_egyeb: false,
            pf_kivul_egyeb_szoveg: '',
            work_hour_start: '9',
            work_hour_end: '16',
            execution_date: ''
        }
    });

    const [materialOptions, setMaterialOptions] = useState({
        insulation: ['Thermowool Basic üveggyapot tekercs (0.039)'],
        vapor_barrier: [],
        breathable_membrane: []
    });

    const [floorPlanUrl, setFloorPlanUrl] = useState(null);
    const [floorPlanPlusUrl, setFloorPlanPlusUrl] = useState(null);
    const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
    const [showFloorPlanPlusModal, setShowFloorPlanPlusModal] = useState(false);

    const [errors, setErrors] = useState({});

    // Address sync logic
    const [isAddressSame, setIsAddressSame] = useState(false);

    useEffect(() => {
        loadProject();
        fetchMaterials();
    }, [id]);

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

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await projectsAPI.getById(id);
            const project = response.data;
            setFloorPlanUrl(project.floor_plan_url);

            // Map flat API response to nested formData structure
            setFormData({
                customer: {
                    full_name: project.full_name || '',
                    birth_name: project.birth_name || '',
                    mother_name: project.mother_name || '',
                    phone: project.phone || '',
                    email: project.email || '',
                    address_postal_code: project.customer_postal_code || '',
                    address_city: project.customer_city || '',
                    address_street: project.customer_street || '',
                    address_house_number: project.customer_house_number || '',
                    id_number: project.id_number || ''
                },
                property: {
                    address_postal_code: project.property_postal_code || '',
                    address_city: project.property_city || '',
                    address_street: project.property_street || '',
                    address_house_number: project.property_house_number || '',
                    hrsz: project.hrsz || '',
                    building_year: project.building_year || '',
                    building_type: project.building_type || 'családi ház',
                    structure_type: project.structure_type || 'fa',
                    structure_thickness: project.structure_thickness || '',
                    unheated_space_type: project.unheated_space_type || 'nincs',
                    unheated_space_area: project.unheated_space_area || '',
                    unheated_space_name: project.unheated_space_name || '',
                    heating_type: project.heating_type || 'gáz készülék'
                },
                details: {
                    gross_area: project.gross_area || '',
                    chimney_area: project.chimney_area || '0',
                    attic_door_area: project.attic_door_area || '0',
                    other_deducted_area: project.other_deducted_area || '0',
                    net_area: project.net_area || '0',
                    net_amount: project.net_amount || '',
                    energy_saving_gj: project.energy_saving_gj || '0',
                    labor_cost: project.labor_cost || '0',
                    hem_value: project.hem_value || '0',
                    government_support: project.government_support || '0',
                    insulation_type: (typeof project.insulation_type === 'object' ? String(project.insulation_type.name || '') : String(project.insulation_type || 'Thermowool Basic üveggyapot tekercs (0.039)')),
                    vapor_barrier_type: (typeof project.vapor_barrier_type === 'object' ? String(project.vapor_barrier_type.name || '') : String(project.vapor_barrier_type || '')),
                    breathable_membrane_type: (typeof project.breathable_membrane_type === 'object' ? String(project.breathable_membrane_type.name || '') : String(project.breathable_membrane_type || '')),
                    // Attic Declaration Mapping
                    attic_door_insulated: project.attic_door_insulated === true, // Ensure boolean
                    pf_kivul_fodemen: project.pf_kivul_fodemen || false,
                    pf_kivul_oromfal: project.pf_kivul_oromfal || false,
                    pf_kivul_bonthato: project.pf_kivul_bonthato || false,
                    pf_kivul_egyeb: project.pf_kivul_egyeb || false,
                    pf_kivul_egyeb_szoveg: project.pf_kivul_egyeb_szoveg || '',
                    work_hour_start: project.work_hour_start || '9',
                    work_hour_end: project.work_hour_end || '16',
                    execution_date: project.execution_date ? new Date(project.execution_date).toISOString().split('T')[0] : '',
                    manual_quantities: project.manual_quantities || {}
                }
            });

            setFloorPlanPlusUrl(project.floor_plan_plus_url);

            // Check if addresses are same
            if (project.customer_postal_code === project.property_postal_code &&
                project.customer_city === project.property_city &&
                project.customer_street === project.property_street &&
                project.customer_house_number === project.property_house_number) {
                setIsAddressSame(true);
            }

            // Update material options with saved values if they are not in the default list
            setMaterialOptions(prev => {
                const newOptions = { ...prev };
                const categories = ['vapor_barrier', 'breathable_membrane', 'insulation'];

                categories.forEach(cat => {
                    const projectRaw = project[`${cat}_type`];
                    const projectVal = typeof projectRaw === 'object' ? String(projectRaw.name || '') : String(projectRaw || '');

                    if (projectVal) {
                        const exists = newOptions[cat].some(opt => (typeof opt === 'string' ? opt : opt.name) === projectVal);
                        if (!exists) {
                            newOptions[cat] = [...newOptions[cat], projectVal];
                        }
                    }
                });
                return newOptions;
            });

            console.log('Floor Plan URL loaded:', project.floor_plan_url);

        } catch (error) {
            console.error('Error loading project:', error);
            showToast('Hiba a projekt betöltésekor', 'error');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

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

        // Auto-fill and calculations logic similar to NewProject
        // (Simplified here for brevity, assuming manual entry or same utility functions used)

        // Auto-calculate net area and contractor fee
        if (section === 'details' && ['gross_area', 'chimney_area', 'attic_door_area', 'other_deducted_area'].includes(field)) {
            const currentDetails = {
                ...formData.details,
                [section]: { ...formData[section], [field]: value }
            }.details; // Need to merge state properly to calculate based on new value

            // Create temp object for calculation
            const updatedDetails = { ...formData.details, [field]: value };

            const netArea = calculateNetArea(
                updatedDetails.gross_area,
                updatedDetails.chimney_area,
                updatedDetails.attic_door_area,
                updatedDetails.other_deducted_area
            );
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
                const response = await materialsAPI.create({
                    category: category,
                    name: newValue.trim()
                });

                if (response.success) {
                    // Update local state
                    setMaterialOptions(prev => ({
                        ...prev,
                        [category]: [...prev[category], newValue.trim()]
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
        // Reuse validation logic
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
        } else if (stepNumber === 4) {
            return true; // No validation for floor plan step
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

    const handleSubmit = async () => {
        if (!validateStep(step)) {
            showToast('Kérjük, töltse ki a kötelező mezőket', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await projectsAPI.fullUpdate(id, formData); // Capture the response
            showToast('Projekt sikeresen frissítve!', 'success');
            // In EditProject, 'id' is already known. The instruction seems to be for NewProject.
            // If the intent is to ensure the ID is valid or from the response, we can check.
            // However, for an update, 'id' is the primary identifier.
            const projectId = response?.data?.id || response?.id || response?.data?.project?.id || id; // Fallback to existing 'id'
            if (projectId) {
                navigate(`/projects/${projectId}`);
            } else {
                console.error('Project ID missing in response after update:', response);
                showToast('Hiba: Nem sikerült a projekt azonosítóját lekérni a frissítés után', 'error');
                navigate(`/projects`); // Navigate to projects list if ID is truly lost
            }
        } catch (error) {
            console.error('Error updating project:', error);
            showToast('Hiba a mentés során', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.customer.full_name) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Adatok betöltése...</p>
            </div>
        );
    }

    return (
        <div className="new-project-container">
            <div className="header-actions" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    onClick={() => navigate(`/projects/${id}`)}
                    className="btn btn-secondary"
                    style={{ padding: '8px' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1>Projekt Szerkesztése</h1>
            </div>

            <div className="stepper">
                <div className={`step ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1. Ügyfél</div>
                <div className="step-line"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`} onClick={() => validateStep(1) && setStep(2)}>2. Ingatlan</div>
                <div className="step-line"></div>
                <div className={`step ${step >= 3 ? 'active' : ''}`} onClick={() => validateStep(2) && setStep(3)}>3. Adatok</div>
                <div className="step-line"></div>
                <div className={`step ${step >= 4 ? 'active' : ''}`} onClick={() => validateStep(3) && setStep(4)}>4. Alaprajz</div>
            </div>

            <div className="form-content">
                {step === 1 && (
                    <div className="form-section">
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
                        {/* More fields... identical to NewProject, could be extracted to component but copying for speed/isolation */}
                        <div className="form-group">
                            <label className="form-label">Születési név</label>
                            <input type="text" value={formData.customer.birth_name} onChange={(e) => handleInputChange('customer', 'birth_name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Anyja neve</label>
                            <input type="text" value={formData.customer.mother_name} onChange={(e) => handleInputChange('customer', 'mother_name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Személyi igazolvány száma</label>
                            <input type="text" value={formData.customer.id_number} onChange={(e) => handleInputChange('customer', 'id_number', e.target.value)} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Telefon *</label>
                                <input type="tel" value={formData.customer.phone} onChange={(e) => handleInputChange('customer', 'phone', e.target.value)} className={errors['customer.phone'] ? 'error' : ''} />
                                {errors['customer.phone'] && <span className="error-message">{errors['customer.phone']}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" value={formData.customer.email} onChange={(e) => handleInputChange('customer', 'email', e.target.value)} className={errors['customer.email'] ? 'error' : ''} />
                                {errors['customer.email'] && <span className="error-message">{errors['customer.email']}</span>}
                            </div>
                        </div>
                        <h3>Lakcím</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Irányítószám</label>
                                <input type="text" value={formData.customer.address_postal_code} onChange={(e) => handleInputChange('customer', 'address_postal_code', e.target.value)} maxLength="4" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Város</label>
                                <input type="text" value={formData.customer.address_city} onChange={(e) => handleInputChange('customer', 'address_city', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Utca</label>
                                <input type="text" value={formData.customer.address_street} onChange={(e) => handleInputChange('customer', 'address_street', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Házszám</label>
                                <input type="text" value={formData.customer.address_house_number} onChange={(e) => handleInputChange('customer', 'address_house_number', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-section">
                        <h2>2. Ingatlan Adatok</h2>

                        <div className="form-row">
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

                        <div className="form-group">
                            <label className="form-label">Kivitelezés dátuma</label>
                            <input
                                type="date"
                                value={formData.details.execution_date}
                                onChange={(e) => handleInputChange('details', 'execution_date', e.target.value)}
                            />
                            <small className="text-muted">Alapértelmezetten a szerződéskötés napja</small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">HRSZ *</label>
                            <input type="text" value={formData.property.hrsz} onChange={(e) => handleInputChange('property', 'hrsz', e.target.value)} className={errors['property.hrsz'] ? 'error' : ''} />
                            {errors['property.hrsz'] && <span className="error-message">{errors['property.hrsz']}</span>}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Építés éve</label>
                                <input type="number" value={formData.property.building_year} onChange={(e) => handleInputChange('property', 'building_year', e.target.value)} className={errors['property.building_year'] ? 'error' : ''} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Épület típusa</label>
                                <select value={formData.property.building_type} onChange={(e) => handleInputChange('property', 'building_type', e.target.value)}>
                                    <option value="családi ház">Családi ház</option>
                                    <option value="sorház">Sorház</option>
                                    <option value="ikerház">Ikerház</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Födém szerkezet típusa</label>
                                <select value={formData.property.structure_type} onChange={(e) => handleInputChange('property', 'structure_type', e.target.value)}>
                                    <option value="fa">Fa</option>
                                    <option value="acel">Acél gerendás</option>
                                    <option value="vasbeton">Vasbeton gerendás</option>
                                    <option value="monolit">Monolit vasbeton</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Szerkezet vastagság (cm)</label>
                                <input type="number" value={formData.property.structure_thickness} onChange={(e) => handleInputChange('property', 'structure_thickness', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Fűtetlen tér alatta</label>
                                <select value={formData.property.unheated_space_type} onChange={(e) => handleInputChange('property', 'unheated_space_type', e.target.value)}>
                                    <option value="nincs">Nincs (Lakótér)</option>
                                    <option value="garázs">Garázs</option>
                                    <option value="télikert">Zárt naptér, átrium, télikert</option>
                                    <option value="egyéb">Egyéb</option>
                                </select>
                            </div>
                            {formData.property.unheated_space_type !== 'nincs' && (
                                <div className="form-group">
                                    <label className="form-label">Alapterület (m²)</label>
                                    <input type="number" value={formData.property.unheated_space_area} onChange={(e) => handleInputChange('property', 'unheated_space_area', e.target.value)} />
                                </div>
                            )}
                            {formData.property.unheated_space_type === 'egyéb' && (
                                <div className="form-group">
                                    <label className="form-label">Megnevezés</label>
                                    <input type="text" value={formData.property.unheated_space_name} onChange={(e) => handleInputChange('property', 'unheated_space_name', e.target.value)} />
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
                        <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input type="checkbox" id="isAddressSame" checked={isAddressSame} onChange={handleAddressSameChange} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                            <label htmlFor="isAddressSame" style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}>A beruházás címe megegyezik a lakcímmel</label>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Irányítószám</label>
                                <input type="text" value={formData.property.address_postal_code} onChange={(e) => handleInputChange('property', 'address_postal_code', e.target.value)} maxLength="4" disabled={isAddressSame} className={isAddressSame ? 'disabled-input' : ''} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Város</label>
                                <input type="text" value={formData.property.address_city} onChange={(e) => handleInputChange('property', 'address_city', e.target.value)} disabled={isAddressSame} className={isAddressSame ? 'disabled-input' : ''} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Utca</label>
                                <input type="text" value={formData.property.address_street} onChange={(e) => handleInputChange('property', 'address_street', e.target.value)} disabled={isAddressSame} className={isAddressSame ? 'disabled-input' : ''} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Házszám</label>
                                <input type="text" value={formData.property.address_house_number} onChange={(e) => handleInputChange('property', 'address_house_number', e.target.value)} disabled={isAddressSame} className={isAddressSame ? 'disabled-input' : ''} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-section">

                        <h2>3. Műszaki és Pénzügyi Adatok</h2>
                        <h3>Területek (m²)</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Bruttó terület *</label>
                                <input type="number" step="0.01" value={formData.details.gross_area} onChange={(e) => handleInputChange('details', 'gross_area', e.target.value)} className={errors['details.gross_area'] ? 'error' : ''} />
                                {errors['details.gross_area'] && <span className="error-message">{errors['details.gross_area']}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kémény terület</label>
                                <input type="number" step="0.01" value={formData.details.chimney_area} onChange={(e) => handleInputChange('details', 'chimney_area', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Padlásfeljáró terület</label>
                                <input type="number" step="0.01" value={formData.details.attic_door_area} onChange={(e) => handleInputChange('details', 'attic_door_area', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Egyéb levonás</label>
                                <input type="number" step="0.01" value={formData.details.other_deducted_area} onChange={(e) => handleInputChange('details', 'other_deducted_area', e.target.value)} />
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
                                    value={formData.details.vapor_barrier_type && typeof formData.details.vapor_barrier_type === 'object' ? formData.details.vapor_barrier_type.name : (formData.details.vapor_barrier_type || '')}
                                    onChange={(e) => handleInputChange('details', 'vapor_barrier_type', e.target.value)}
                                >
                                    <option value="">Válasszon típust...</option>
                                    {materialOptions.vapor_barrier.map((opt, idx) => {
                                        const label = typeof opt === 'string' ? opt : String(opt.name || '');
                                        const val = typeof opt === 'string' ? opt : String(opt.name || '');
                                        return <option key={idx} value={val}>{label}</option>;
                                    })}
                                </select>
                                <button type="button" className="btn-icon-plus" onClick={() => addNewMaterialOption('vapor_barrier')}><Plus size={20} /></button>
                            </div>
                            {(() => {
                                const val = formData.details.vapor_barrier_type;
                                const name = typeof val === 'object' ? String(val.name || '') : String(val || '');
                                const optionsList = materialOptions.vapor_barrier || [];
                                const selected = optionsList.find(m => (typeof m === 'string' ? m : String(m.name || '')) === name);
                                const needsManual = selected && (typeof selected === 'string' || !selected.coverage);
                                if (needsManual && name) {
                                    return (
                                        <div className="mt-2">
                                            <label className="small text-muted">Mennyiség (tekercs):</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={String(formData.details.manual_quantities?.vapor_barrier || '')}
                                                onChange={(e) => handleInputChange('details', 'manual_quantities', { ...formData.details.manual_quantities, vapor_barrier: e.target.value })}
                                                placeholder="Kézi megadás..."
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="material-selection-row">
                            <label className="form-label">Üveggyapot típusa:</label>
                            <div className="input-group">
                                <select
                                    value={formData.details.insulation_type && typeof formData.details.insulation_type === 'object' ? formData.details.insulation_type.name : (formData.details.insulation_type || '')}
                                    onChange={(e) => handleInputChange('details', 'insulation_type', e.target.value)}
                                >
                                    <option value="">Válasszon...</option>
                                    {materialOptions.insulation.map((opt, idx) => {
                                        const label = typeof opt === 'string' ? opt : String(opt.name || '');
                                        const val = typeof opt === 'string' ? opt : String(opt.name || '');
                                        return <option key={idx} value={val}>{label}</option>;
                                    })}
                                </select>
                                <button type="button" className="btn-icon-plus" onClick={() => addNewMaterialOption('insulation')}><Plus size={20} /></button>
                            </div>
                            {(() => {
                                const val = formData.details.insulation_type;
                                const name = typeof val === 'object' ? String(val.name || '') : String(val || '');
                                const optionsList = materialOptions.insulation || [];
                                const selected = optionsList.find(m => (typeof m === 'string' ? m : String(m.name || '')) === name);
                                const needsManual = selected && (typeof selected === 'string' || !selected.coverage);
                                if (needsManual && name) {
                                    return (
                                        <div className="mt-2">
                                            <label className="small text-muted">Mennyiség (tekercs):</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={String(formData.details.manual_quantities?.insulation || '')}
                                                onChange={(e) => handleInputChange('details', 'manual_quantities', { ...formData.details.manual_quantities, insulation: e.target.value })}
                                                placeholder="Kézi megadás..."
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="material-selection-row">
                            <label className="form-label">Pára áteresztő fólia:</label>
                            <div className="input-group">
                                <select
                                    value={formData.details.breathable_membrane_type && typeof formData.details.breathable_membrane_type === 'object' ? formData.details.breathable_membrane_type.name : (formData.details.breathable_membrane_type || '')}
                                    onChange={(e) => handleInputChange('details', 'breathable_membrane_type', e.target.value)}
                                >
                                    <option value="">Válasszon típust...</option>
                                    {materialOptions.breathable_membrane.map((opt, idx) => {
                                        const label = typeof opt === 'string' ? opt : String(opt.name || '');
                                        const val = typeof opt === 'string' ? opt : String(opt.name || '');
                                        return <option key={idx} value={val}>{label}</option>;
                                    })}
                                </select>
                                <button type="button" className="btn-icon-plus" onClick={() => addNewMaterialOption('breathable_membrane')}><Plus size={20} /></button>
                            </div>
                            {(() => {
                                const val = formData.details.breathable_membrane_type;
                                const name = typeof val === 'object' ? String(val.name || '') : String(val || '');
                                const optionsList = materialOptions.breathable_membrane || [];
                                const selected = optionsList.find(m => (typeof m === 'string' ? m : String(m.name || '')) === name);
                                const needsManual = selected && (typeof selected === 'string' || !selected.coverage);
                                if (needsManual && name) {
                                    return (
                                        <div className="mt-2">
                                            <label className="small text-muted">Mennyiség (tekercs):</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={String(formData.details.manual_quantities?.breathable_membrane || '')}
                                                onChange={(e) => handleInputChange('details', 'manual_quantities', { ...formData.details.manual_quantities, breathable_membrane: e.target.value })}
                                                placeholder="Kézi megadás..."
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        <div className="calculated-field">
                            <label className="form-label">Nettó szigetelt terület</label>
                            <div className="calculated-value">{String(formData.details.net_area)} m²</div>
                        </div>
                        <div className="calculated-field">
                            <label className="form-label">Energiamegtakarítás</label>
                            <div className="calculated-value">{calculateEnergySaving(formData.details.net_area)} GJ</div>
                        </div>
                        <div className="calculated-field">
                            <label className="form-label">Ajánlott vállalkozói díj (számított)</label>
                            <div className="calculated-value">{formatCurrency(calculateContractorFee(calculateEnergySaving(formData.details.net_area)))}</div>
                            <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>{calculateEnergySaving(formData.details.net_area)} GJ × 12,392 Ft/GJ</small>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="form-section">
                        <h2>4. Alaprajz Szerkesztése</h2>

                        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            {floorPlanUrl ? (
                                <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '10px', backgroundColor: '#fdfdfd' }}>
                                    <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>Jelenlegi alaprajz:</p>
                                    <img
                                        src={`${import.meta.env.PROD ? '' : 'http://localhost:4000'}${floorPlanUrl}`}
                                        alt="Alaprajz"
                                        style={{ maxWidth: '100%', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#f9fafb', borderRadius: '8px', marginBottom: '20px' }}>
                                    <p>Nincs még alaprajz feltöltve ehhez a projekthez.</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowFloorPlanModal(true)}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                                <PenTool size={18} style={{ marginRight: '8px' }} />
                                {floorPlanUrl ? 'Alaprajz Szerkesztése (V2)' : 'Új Alaprajz Készítése (V2)'}
                            </button>
                        </div>

                        {/* SECOND FLOOR PLAN SECTION */}
                        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                            <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '15px', color: '#4b5563' }}>Kiegészítő Alaprajz (Opcionális)</h3>
                            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                                Ha az ingatlannak két különálló padlástere van, itt tölthet fel egy második alaprajzot.
                            </p>

                            {floorPlanPlusUrl ? (
                                <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '10px', backgroundColor: '#fdfdfd' }}>
                                    <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>Jelenlegi kiegészítő alaprajz:</p>
                                    <img
                                        src={`${import.meta.env.PROD ? '' : 'http://localhost:4000'}${floorPlanPlusUrl}`}
                                        alt="Kiegészítő Alaprajz"
                                        style={{ maxWidth: '100%', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: '#f9fafb', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #e5e7eb' }}>
                                    <p>Nincs még kiegészítő alaprajz feltöltve.</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowFloorPlanPlusModal(true)}
                                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1', color: 'white' }}
                            >
                                <PenTool size={18} style={{ marginRight: '8px' }} />
                                {floorPlanPlusUrl ? 'Kiegészítő Alaprajz Szerkesztése' : 'Új Kiegészítő Alaprajz'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={step === 1 ? () => navigate(`/projects/${id}`) : () => setStep(step - 1)}
                    >
                        {step === 1 ? 'Mégse' : 'Vissza'}
                    </button>
                    {step < 4 ? (
                        <button className="btn btn-primary" onClick={() => validateStep(step) && setStep(step + 1)}>
                            Tovább
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Mentés...' : <><Save size={18} style={{ marginRight: '5px' }} /> Mentés</>}
                        </button>
                    )}
                </div>
            </div>

            <FloorPlanModal
                projectId={id}
                initialImageUrl={floorPlanUrl}
                isOpen={showFloorPlanModal}
                onClose={() => setShowFloorPlanModal(false)}
                onSaveSuccess={() => {
                    loadProject();
                    showToast('Alaprajz sikeresen mentve!', 'success');
                }}
            />

            <FloorPlanModal
                projectId={id}
                initialImageUrl={floorPlanPlusUrl}
                isOpen={showFloorPlanPlusModal}
                onClose={() => setShowFloorPlanPlusModal(false)}
                photoType="floor_plan_plus"
                title="Kiegészítő Alaprajz Tervező"
                onSaveSuccess={() => {
                    loadProject();
                    showToast('Kiegészítő alaprajz sikeresen mentve!', 'success');
                }}
            />
        </div>
    );
};

export default EditProject;
