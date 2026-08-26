import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

const Inventory = () => {
    const { token, user } = useAuth(); // Get user

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRestock, setShowRestock] = useState(false);
    const [restockData, setRestockData] = useState({ materialId: '', quantity: '', notes: '' });

    const [showEdit, setShowEdit] = useState(false);
    const [editData, setEditData] = useState({ id: '', name: '', unit: '', coverage: '', usage: '' });

    const [showCreate, setShowCreate] = useState(false);
    const [createData, setCreateData] = useState({ category: 'insulation', name: '' });

    const isAdmin = user?.role === 'admin';

    const fetchMaterials = async () => {
        try {
            // Admin sees Central Stock, Users see My Stock
            const endpoint = isAdmin ? '/inventory' : '/inventory/my-stock';
            const data = await api.get(endpoint);

            if (data.success) {
                // If it's my-stock, structure might be slightly different, let's normalize or handle it.
                // /my-stock returns: { id, name, unit, stock }
                // /inventory returns: { id, category, name, stock_quantity_current, unit, coverage }

                // We map to a common structure for the table
                const normalized = data.data.map(item => ({
                    ...item,
                    // If my-stock, 'stock' is the quantity. If inventory, 'stock_quantity_current' is.
                    current_stock: item.stock !== undefined ? parseInt(item.stock) : item.stock_quantity_current
                }));
                // For users, maybe filter out 0 stock items? Or show them?
                // /my-stock already filters > 0 usually.

                setMaterials(normalized);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && user) fetchMaterials();
    }, [token, user]);

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await api.post('/inventory/restock', {
                items: [{
                    material_id: restockData.materialId,
                    quantity: parseInt(restockData.quantity)
                }],
                notes: restockData.notes
            });

            if (data.success) {
                alert('Sikeres bevételezés!');
                setShowRestock(false);
                setRestockData({ materialId: '', quantity: '', notes: '' });
                fetchMaterials();
            } else {
                alert('Hiba: ' + data.error);
            }
        } catch (error) {
            console.error('Restock error:', error);
            alert('Hálózati hiba történt');
        }
    };

    const openEditModal = (material) => {
        const coverage = parseFloat(material.coverage) || 0;
        const usage = coverage > 0 ? (1 / coverage).toFixed(4) : 0;
        setEditData({
            id: material.id,
            name: material.name,
            unit: material.unit,
            coverage: coverage,
            usage: usage
        });
        setShowEdit(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await api.put(`/inventory/${editData.id}`, {
                name: editData.name,
                unit: editData.unit,
                coverage: parseFloat(editData.coverage)
            });

            if (data.success) {
                alert('Sikeres módosítás!');
                setShowEdit(false);
                fetchMaterials();
            } else {
                alert('Hiba: ' + data.error);
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Hálózati hiba történt');
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await api.post('/materials', createData); // Uses /api/materials route

            if (data.success) {
                alert('Anyag sikeresen létrehozva!');
                setShowCreate(false);
                setCreateData({ category: 'insulation', name: '' });
                fetchMaterials();
            } else {
                alert('Hiba: ' + data.error);
            }
        } catch (error) {
            console.error('Create error:', error);
            alert('Hálózati hiba történt');
        }
    };

    const handleCoverageChange = (val) => {
        const cov = parseFloat(val);
        setEditData({
            ...editData,
            coverage: val,
            usage: cov > 0 ? (1 / cov).toFixed(4) : 0
        });
    };

    const handleUsageChange = (val) => {
        const use = parseFloat(val);
        setEditData({
            ...editData,
            usage: val,
            coverage: use > 0 ? (1 / use).toFixed(2) : 0
        });
    };

    if (loading) return <div>Betöltés...</div>;

    return (
        <div className="inventory-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{isAdmin ? 'Raktárkészlet (Központi)' : 'Raktárkészlet (Saját)'}</h2>
                <div style={{ gap: '10px', display: 'flex' }}>
                    {isAdmin && (
                        <>
                            <button onClick={() => setShowCreate(true)} className="btn btn-success">
                                + Új Anyag
                            </button>
                            <button onClick={() => setShowRestock(true)} className="btn btn-primary">
                                + Bevételezés
                            </button>
                            <a href="/handover" className="btn btn-secondary">
                                Anyagkiadás Projekthez
                            </a>
                        </>
                    )}
                    <a href="/stock-history" className="btn btn-info text-white">
                        Anyagmozgások
                    </a>
                </div>
            </div>

            {/* Create Material Modal */}
            {showCreate && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '500px' }}>
                        <h3>Új Anyag Felvétele</h3>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="form-group">
                                <label>Kategória</label>
                                <select
                                    value={createData.category}
                                    onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                                    required
                                    className="form-control"
                                >
                                    <option value="insulation">Szigetelés</option>
                                    <option value="vapor_barrier">Párazáró fólia</option>
                                    <option value="breathable_membrane">Páraáteresztő fólia</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Név</label>
                                <input
                                    type="text"
                                    value={createData.name}
                                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                                    required
                                    className="form-control"
                                    placeholder="pl. Üveggyapot 10cm"
                                />
                            </div>
                            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                                <button type="submit" className="btn btn-success">Létrehozás</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {showRestock && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
                        <h3>Készletfeltöltés</h3>
                        <form onSubmit={handleRestockSubmit}>
                            <div className="form-group">
                                <label>Anyag</label>
                                <select
                                    value={restockData.materialId}
                                    onChange={(e) => setRestockData({ ...restockData, materialId: e.target.value })}
                                    required
                                    className="form-control"
                                >
                                    <option value="">Válassz...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {String(m.name || '')} ({String(m.unit || '')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mennyiség</label>
                                <input
                                    type="number"
                                    value={restockData.quantity}
                                    onChange={(e) => setRestockData({ ...restockData, quantity: e.target.value })}
                                    required
                                    min="1"
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Megjegyzés</label>
                                <input
                                    type="text"
                                    value={restockData.notes}
                                    onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                                    className="form-control"
                                />
                            </div>
                            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowRestock(false)}>Mégse</button>
                                <button type="submit" className="btn btn-success">Mentés</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '500px' }}>
                        <h3>Anyag Szerkesztése</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>Név</label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    required
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label>Egység (pl. tekercs)</label>
                                    <input
                                        type="text"
                                        value={editData.unit}
                                        onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f0f9ff', padding: '10px', borderRadius: '5px' }}>
                                <div>
                                    <label>Kiadósság (m2 / egység)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editData.coverage}
                                        onChange={(e) => handleCoverageChange(e.target.value)}
                                        className="form-control"
                                    />
                                    <small className="text-muted">Egy egység hány m2-t fed le?</small>
                                </div>
                                <div>
                                    <label>Szükséglet (egység / m2)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={editData.usage}
                                        onChange={(e) => handleUsageChange(e.target.value)}
                                        className="form-control"
                                    />
                                    <small className="text-muted">1 m2-hez mennyi kell?</small>
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowEdit(false)}>Mégse</button>
                                <button type="submit" className="btn btn-primary">Frissítés</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Kategória</th>
                        <th>Név</th>
                        <th>{isAdmin ? 'Központi Készlet' : 'Saját Készlet'}</th>
                        <th>Egység</th>
                        <th>Kiadósság (m2/egység)</th>
                        {isAdmin && <th>Művelet</th>}
                    </tr>
                </thead>
                <tbody>
                    {materials.map(m => (
                        <tr key={m.id}>
                            <td>
                                {m.category === 'insulation' ? 'Szigetelés' :
                                    m.category === 'vapor_barrier' ? 'Párazáró' :
                                        m.category === 'breathable_membrane' ? 'Páraáteresztő' : String(m.category || '-')}
                            </td>
                            <td>{String(m.name || '')}</td>
                            <td style={{ fontWeight: 'bold', color: m.current_stock < 5 ? 'red' : 'green' }}>
                                {m.current_stock}
                            </td>
                            <td>{String(m.unit || '')}</td>
                            <td>
                                {m.coverage || '-'}
                                {m.coverage ? <small style={{ display: 'block', color: '#666' }}>({(1 / m.coverage).toFixed(2)}/m2)</small> : ''}
                            </td>
                            {isAdmin && (
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => openEditModal(m)}
                                    >
                                        Szerkesztés
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;
