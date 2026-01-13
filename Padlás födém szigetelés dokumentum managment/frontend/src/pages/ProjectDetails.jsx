import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, PenTool } from 'lucide-react';
import { projectsAPI, documentsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';
import SignatureModal from '../components/SignatureModal';


import FloorPlanModal from '../components/FloorPlanModal';
import BulkPhotoUploader from '../components/BulkPhotoUploader';
import PhotoGallery from '../components/PhotoGallery';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useApp();

    // Signature state
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showContractorModal, setShowContractorModal] = useState(false);
    const [customerSignature, setCustomerSignature] = useState(null);
    const [contractorSignature, setContractorSignature] = useState(null);
    const [refreshPhotos, setRefreshPhotos] = useState(0);
    const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await projectsAPI.getById(id);
            setProject(response.data);

            // Initialize signatures
            if (response.data.customer_signature_data) {
                setCustomerSignature(response.data.customer_signature_data);
            }
            if (response.data.contractor_signature_data) {
                setContractorSignature(response.data.contractor_signature_data);
            }
        } catch (error) {
            showToast('Hiba a projekt betöltésekor', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDocument = async (documentType) => {
        try {
            showToast('Dokumentum generálása...', 'info');
            const response = await documentsAPI.generate(id, documentType);
            showToast('Dokumentum sikeresen generálva!', 'success');

            console.log('Document generation response:', response);

            // Construct download URL
            if (response.data && response.data.fileUrl) {
                // FORCE BACKEND URL with cache-busting timestamp
                const backendBaseUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';
                const timestamp = new Date().getTime(); // Cache buster
                const staticUrl = `${backendBaseUrl}${response.data.fileUrl}?t=${timestamp}`;
                console.log('Opening static URL:', staticUrl);

                const link = document.createElement('a');
                link.href = staticUrl;
                link.setAttribute('download', response.data.fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } else {
                console.log('Fallback to download API:', response.data.fileName);
                window.open(documentsAPI.download(response.data.fileName), '_blank');
            }

        } catch (error) {
            showToast('Hiba a dokumentum generálásakor', 'error');
            console.error(error);
        }
    };

    const handleSaveSignature = async (signatureType, signatureData) => {
        try {
            await projectsAPI.saveSignature(id, { signatureType, signatureData });

            if (signatureType === 'customer') {
                setCustomerSignature(signatureData);
            } else {
                setContractorSignature(signatureData);
            }
            showToast(`${signatureType === 'customer' ? 'Ügyfél' : 'Kivitelező'} aláírás sikeresen mentve`, 'success');
        } catch (error) {
            showToast('Hiba az aláírás mentésekor', 'error');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Projekt betöltése...</p>
            </div>
        );
    }

    if (!project) {
        return <div className="card">Projekt nem található</div>;
    }

    return (
        <div className="project-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Projekt Részletek</h1>
                <button
                    className="btn btn-secondary"
                    onClick={() => window.open(projectsAPI.exportProject(id), '_blank')}
                    style={{ backgroundColor: '#4f46e5', color: 'white' }}
                >
                    📦 Összes adat letöltése (ZIP)
                </button>
            </div>

            {/* 1. Alapadatok & Ügyfél (Két oszlop) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="card">
                    <h2>Alapadatok</h2>
                    <p><strong>Szerződésszám:</strong> {project.contract_number}</p>
                    <p><strong>Státusz:</strong> {project.status}</p>
                    <p><strong>Létrehozva:</strong> {formatDate(project.created_at)}</p>
                </div>

                <div className="card">
                    <h2>Ügyfél Adatai</h2>
                    <p><strong>Név:</strong> {project.full_name}</p>
                    <p><strong>Születési név:</strong> {project.birth_name || '-'}</p>
                    <p><strong>Anyja neve:</strong> {project.mother_name || '-'}</p>
                    <p><strong>Szem. ig. szám:</strong> {project.id_number || '-'}</p>
                    <p><strong>Telefon:</strong> {project.phone}</p>
                    <p><strong>Email:</strong> {project.email}</p>
                    <p><strong>Lakcím:</strong> {project.customer_postal_code} {project.customer_city}, {project.customer_street} {project.customer_house_number}</p>
                </div>
            </div>

            {/* 2. Ingatlan Adatok */}
            <div className="card">
                <h2>Ingatlan Adatai</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <p><strong>Cím:</strong> {project.property_postal_code} {project.property_city}, {project.property_street} {project.property_house_number}</p>
                        <p><strong>HRSZ:</strong> {project.hrsz || '-'}</p>
                        <p><strong>Építés éve:</strong> {project.building_year || '-'}</p>
                        <p><strong>Épület típusa:</strong> {project.building_type || '-'}</p>
                    </div>
                    <div>
                        <p><strong>Födém szerkezet:</strong> {project.structure_type || '-'} ({project.structure_thickness || 0} cm)</p>
                        {/* <p><strong>Tető:</strong> {project.roof_type || '-'} ({project.roof_thickness || 0} cm)</p> */}
                        <p><strong>Fűtetlen tér:</strong> {project.unheated_space_type || '-'} ({project.unheated_space_area || 0} m²)</p>
                        {project.unheated_space_name && <p><strong>Megnevezés:</strong> {project.unheated_space_name}</p>}
                    </div>
                </div>
            </div>

            {/* 3. Műszaki & Pénzügyi Adatok */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="card">
                    <h2>Műszaki Számítások</h2>
                    <p><strong>Bruttó födém terület:</strong> {project.gross_area} m²</p>
                    <p><strong>Levonások (Kémény/Egyéb):</strong> {(Number(project.chimney_area || 0) + Number(project.other_deducted_area || 0)).toFixed(2)} m²</p>
                    <p><strong>Padlásfeljáró:</strong> {project.attic_door_area || 0} m² ({project.attic_door_insulated ? 'Szigetelt' : 'Szigeteletlen'})</p>
                    <p style={{ fontSize: '1.1em', color: '#2563eb', fontWeight: 'bold' }}><strong>Nettó szigetelendő:</strong> {project.net_area} m²</p>
                    <hr />
                    <p><strong>Szigetelés vastagsága:</strong> {project.insulation_thickness || 25} cm</p>
                    <p><strong>Hőellenállás (R):</strong> {project.r_value || 6.25} m²K/W</p>
                    <p><strong>Várható megtakarítás:</strong> {project.energy_saving_gj || 0} GJ/év</p>
                    <hr />
                    <h3>Beépített Anyagok</h3>
                    <p><strong>Párazáró fólia:</strong> {project.vapor_barrier_type || '-'}</p>
                    <p><strong>Üveggyapot:</strong> {project.insulation_type || '-'}</p>
                    <p><strong>Páraáteresztő fólia:</strong> {project.breathable_membrane_type || '-'}</p>
                </div>

                <div className="card">
                    <h2>Pénzügyi Adatok & Határidők</h2>
                    <p><strong>Vállalási ár (Bruttó):</strong> {project.net_amount ? new Intl.NumberFormat('hu-HU').format(project.net_amount) : 0} Ft</p>
                    <p><strong>Anyagköltség (Számított):</strong> {project.net_amount && project.labor_cost ? new Intl.NumberFormat('hu-HU').format(project.net_amount - project.labor_cost) : 0} Ft</p>
                    <p><strong>Munkadíj:</strong> {project.labor_cost ? new Intl.NumberFormat('hu-HU').format(project.labor_cost) : 0} Ft</p>
                    <p><strong>Támogatás összege:</strong> {project.government_support ? new Intl.NumberFormat('hu-HU').format(project.government_support) : 0} Ft</p>
                    <p><strong>HEM Érték:</strong> {project.hem_value ? new Intl.NumberFormat('hu-HU').format(project.hem_value) : 0} Ft</p>
                    <hr />
                    <p><strong>Munka kezdete:</strong> {formatDate(project.work_start_date)}</p>
                    <p><strong>Munka vége:</strong> {formatDate(project.work_end_date)}</p>
                </div>
            </div>

            <div className="card">
                <h2>Alaprajz</h2>

                {/* Floor Plan Preview if exists */}
                {project.floor_plan_url && (
                    <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '10px', backgroundColor: '#fdfdfd' }}>
                        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>Mentett alaprajz:</p>
                        <img
                            src={`${import.meta.env.PROD ? '' : 'http://localhost:3000'}${project.floor_plan_url}`}
                            alt="Alaprajz"
                            style={{ maxWidth: '100%', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        />
                    </div>
                )}

                <button
                    onClick={() => setShowFloorPlanModal(true)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                    <PenTool size={18} />
                    {project.floor_plan_url ? 'Alaprajz Szerkesztése (V2)' : 'Új Alaprajz Készítése (V2)'}
                </button>
            </div>

            <div className="card">
                <h2>Projekt Dokumentáció (Fotók)</h2>
                <BulkPhotoUploader
                    projectId={id}
                    onUploadSuccess={() => {
                        const timestamp = new Date().getTime();
                        setRefreshPhotos(timestamp);
                    }}
                />
                <PhotoGallery
                    projectId={id}
                    refreshTrigger={refreshPhotos}
                />
            </div>

            <div className="card">
                <h2>Digitális Aláírások</h2>
                <div className="signatures-container" style={{ maxWidth: '400px', margin: '0 auto' }}>

                    {/* Ügyfél Aláírás */}
                    <div className="signature-box" style={{ textAlign: 'center' }}>
                        <h3>Ügyfél</h3>
                        <div style={{
                            border: '2px dashed #ddd',
                            borderRadius: '8px',
                            height: '150px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                            backgroundColor: '#f9f9f9',
                            overflow: 'hidden'
                        }}>
                            {customerSignature ? (
                                <img src={customerSignature} alt="Ügyfél aláírás" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                            ) : (
                                <span style={{ color: '#aaa' }}>Nincs aláírva</span>
                            )}
                        </div>
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => setShowCustomerModal(true)}
                        >
                            {customerSignature ? <><CheckCircle size={18} /> Aláírva</> : <><PenTool size={18} /> Aláírás</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2>Dokumentumok Generálása</h2>
                <div className="document-buttons">
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerateDocument('kivitelezesi_szerzodes')}
                    >
                        📄 Kivitelezési Szerződés
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerateDocument('atadas_atveteli')}
                    >
                        📄 Átadás-átvételi Jegyzőkönyv
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerateDocument('kivitelezoi_nyilatkozat')}
                    >
                        📄 Kivitelezői Nyilatkozat
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerateDocument('megallapodas_hem')}
                    >
                        📄 HEM Megállapodás
                    </button>
                </div>
            </div>

            <SignatureModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSave={(data) => handleSaveSignature('customer', data)}
                title={`Ügyfél aláírása - ${project.full_name}`}
            />

            <SignatureModal
                isOpen={showContractorModal}
                onClose={() => setShowContractorModal(false)}
                onSave={(data) => handleSaveSignature('contractor', data)}
                title="Kivitelező aláírása"
            />

            <FloorPlanModal
                projectId={id}
                isOpen={showFloorPlanModal}
                onClose={() => setShowFloorPlanModal(false)}
                onSaveSuccess={() => {
                    loadProject();
                    showToast('Alaprajz sikeresen mentve!', 'success');
                }}
            />
        </div>
    );
};

export default ProjectDetails;
