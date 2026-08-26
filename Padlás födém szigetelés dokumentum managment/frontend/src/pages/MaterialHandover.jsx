import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SignatureModal from '../components/SignatureModal';
import api from '../services/api';

const MaterialHandover = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [users, setUsers] = useState([]); // List of users for admin to select
    const [handoverType, setHandoverType] = useState('project'); // 'project' or 'user'
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState(''); // ID of recipient user
    const [step, setStep] = useState(1); // 1: Select Project/User, 2: Review/Select Items, 3: Sign

    // For Project Mode:
    const [calculatedItems, setCalculatedItems] = useState([]);

    // For User Mode:
    const [manualQuantities, setManualQuantities] = useState({}); // { material_id: quantity }

    const [loading, setLoading] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchProjects();
        fetchMaterials();
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        try {
            console.log('[MaterialHandover] Fetching users... Current user from context:', user);
            // Force bypass cache with timestamp
            const data = await api.get(`/auth/users?_t=${Date.now()}`);
            console.log('[MaterialHandover] Users API Response:', data);
            if (data.success) {
                console.log('[MaterialHandover] Setting users:', data.data);
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Hiba a felhasználók betöltésekor: ' + error.message);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await api.get('/projects');
            if (data.success) {
                setProjects(data.data);
            } else {
                console.error('Failed to load projects:', data.error);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            const data = await api.get('/inventory');
            if (data.success) {
                setMaterials(data.data);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const handleProjectSelect = async () => {
        if (!selectedProject) return;
        setLoading(true);
        try {
            const data = await api.get(`/inventory/calculate-needs/${selectedProject}`);
            if (data.success) {
                setCalculatedItems(data.data.suggestions.map(item => ({
                    ...item,
                    actual_quantity: item.suggested_quantity // Default to suggested
                })));
                setStep(2);
            } else {
                alert('Hiba: ' + data.error);
            }
        } catch (error) {
            console.error('Calculation error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (index, value) => {
        const newItems = [...calculatedItems];
        newItems[index].actual_quantity = parseInt(value) || 0;
        setCalculatedItems(newItems);
    };

    const handleSignatureSave = async (signatureData) => {
        setLoading(true);
        try {
            // Prepare items
            let itemsToSubmit = [];
            if (handoverType === 'project') {
                itemsToSubmit = calculatedItems
                    .filter(i => i.actual_quantity > 0)
                    .map(i => ({ material_id: i.material_id, quantity: i.actual_quantity }));
            } else {
                itemsToSubmit = Object.entries(manualQuantities)
                    .filter(([_, qty]) => qty > 0)
                    .map(([id, qty]) => ({ material_id: parseInt(id), quantity: parseInt(qty) }));
            }

            if (itemsToSubmit.length === 0) {
                alert('Nincs kiválasztott anyag!');
                setLoading(false);
                return;
            }

            const data = await api.post('/inventory/handover', {
                project_id: handoverType === 'project' ? selectedProject : null,
                recipient_id: handoverType === 'project' ? user.id : selectedRecipient,
                items: itemsToSubmit,
                signature: signatureData, // Can be null if User Mode
                notes: notes
            });

            if (data.success) {
                alert(handoverType === 'user' ? 'Kiadás sikeresen elküldve az alvállalkozónak!' : 'Átvétel sikeresen rögzítve!');
                navigate('/inventory'); // Navigate back to inventory or somewhere relevant
            } else {
                alert('Hiba: ' + data.error);
            }

        } catch (error) {
            console.error('Handover error:', error);
            alert('Hálózati hiba történt.');
        } finally {
            setLoading(false);
            setShowSignature(false);
        }
    };

    return (
        <div className="handover-page">
            <h2>Anyagkiadás Projekthez</h2>

            {/* Step 1: Select Project or User Mode */}
            {step === 1 && (
                <div className="card" style={{ padding: '20px', maxWidth: '600px' }}>

                    <div className="mode-selector" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button
                            className={`btn ${handoverType === 'project' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setHandoverType('project')}
                        >
                            Projekthez Rendelés
                        </button>
                        <button
                            className={`btn ${handoverType === 'user' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setHandoverType('user')}
                        >
                            Saját Raktárba (Tömeges)
                        </button>
                    </div>

                    {handoverType === 'project' ? (
                        <div className="form-group">
                            <label>Válassz Projektet:</label>
                            <select
                                className="form-control"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="">-- Válassz --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.contract_number} - {p.customer_name} ({p.status})
                                    </option>
                                ))}
                            </select>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '20px' }}
                                disabled={!selectedProject || loading}
                                onClick={handleProjectSelect}
                            >
                                {loading ? 'Számítás...' : 'Tovább'}
                            </button>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Címzett (Kinek adod át?):</label>
                            <select
                                className="form-control"
                                value={selectedRecipient}
                                onChange={(e) => setSelectedRecipient(e.target.value)}
                            >
                                <option value="">-- Válassz Alvállalkozót (v59) --</option>
                                <option value={user?.id}>{user?.full_name || user?.email} (Saját magam)</option>
                                {users.filter(u => u.id !== user?.id).map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.full_name || u.email} ({u.role})
                                    </option>
                                ))}
                            </select>
                            <p className="text-muted" style={{ marginTop: '10px' }}>
                                Ebben a módban közvetlenül adhats ki anyagokat a központi raktárból a kiválasztott felhasználónak.
                            </p>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '20px' }}
                                disabled={!selectedRecipient}
                                onClick={() => setStep(2)}
                            >
                                Tovább az Anyagválasztáshoz
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Review Items */}
            {step === 2 && (
                <div className="card" style={{ padding: '20px' }}>
                    <h3>Szükséges Anyagok</h3>
                    <p>Ellenőrizd és módosítsd a mennyiségeket.</p>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Megnevezés</th>
                                <th>Készlet (Központi)</th>
                                {handoverType === 'project' && <th>Javasolt</th>}
                                <th>Kiadandó</th>
                                <th>Egység</th>
                            </tr>
                        </thead>
                        <tbody>
                            {handoverType === 'project' ? (
                                // PROJECT MODE: Show calculated items
                                calculatedItems.map((item, index) => (
                                    <tr key={item.material_id}>
                                        <td>{item.name} <br /><small className="text-muted">{item.reason}</small></td>
                                        <td>{item.current_stock}</td>
                                        <td>{item.suggested_quantity}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ width: '80px' }}
                                                value={item.actual_quantity}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                min="0"
                                            />
                                        </td>
                                        <td>{item.unit}</td>
                                    </tr>
                                ))
                            ) : (
                                // USER/BULK MODE: Show all materials
                                materials.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td>{m.stock_quantity_current}</td>
                                        {handoverType === 'project' && <td>-</td>}
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ width: '80px' }}
                                                value={manualQuantities[m.id] || ''}
                                                placeholder="0"
                                                onChange={(e) => setManualQuantities({
                                                    ...manualQuantities,
                                                    [m.id]: parseInt(e.target.value) || 0
                                                })}
                                                min="0"
                                            />
                                        </td>
                                        <td>{m.unit}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Megjegyzés:</label>
                        <textarea
                            className="form-control"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>Vissza</button>

                        {handoverType === 'user' ? (
                            <button
                                className="btn btn-warning"
                                onClick={() => handleSignatureSave(null)} // No signature needed for request
                                disabled={loading}
                            >
                                {loading ? 'Küldés...' : 'Kiadás Indítása (Aláírás Nélkül)'}
                            </button>
                        ) : (
                            <button className="btn btn-success" onClick={() => setShowSignature(true)}>
                                Aláírás és Átvétel
                            </button>
                        )}
                    </div>
                </div>
            )}

            <SignatureModal
                isOpen={showSignature}
                onClose={() => setShowSignature(false)}
                onSave={handleSignatureSave}
                title="Átvétel igazolása"
            />
        </div>
    );
};

export default MaterialHandover;
