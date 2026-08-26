import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { projectsAPI } from '../services/api';

const ProjectUsage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [project, setProject] = useState(null);
    const [myStock, setMyStock] = useState([]);
    const [itemsToUse, setItemsToUse] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProject();
        fetchMyStock();
    }, [id, token]);

    const fetchProject = async () => {
        try {
            const res = await projectsAPI.getById(id);
            setProject(res.data);
        } catch (err) {
            console.error(err);
            setError('Nem sikerült betölteni a projektet.');
        }
    };

    const fetchMyStock = async () => {
        try {
            const data = await api.get('/inventory/my-stock');
            if (data.success) {
                setMyStock(data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        setItemsToUse([...itemsToUse, { material_id: '', quantity: 1, max: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...itemsToUse];
        newItems.splice(index, 1);
        setItemsToUse(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...itemsToUse];
        newItems[index][field] = value;

        if (field === 'material_id') {
            const selectedMaterial = myStock.find(m => m.id === parseInt(value));
            if (selectedMaterial) {
                newItems[index].max = selectedMaterial.stock;
                newItems[index].unit = selectedMaterial.unit;
            } else {
                newItems[index].max = 0;
            }
        }

        setItemsToUse(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (itemsToUse.length === 0) {
            setError('Adj hozzá legalább egy anyagot!');
            setLoading(false);
            return;
        }

        const payload = {
            project_id: id,
            items: itemsToUse.map(i => ({
                material_id: parseInt(i.material_id),
                quantity: parseInt(i.quantity)
            })),
            notes
        };

        try {
            const data = await api.post('/inventory/usage', payload);

            if (data.success) {
                alert('Sikeres rögzítés!');
                navigate(`/projects/${id}`);
            } else {
                setError(data.error || 'Hiba történt.');
            }
        } catch (err) {
            console.error(err);
            setError('Hálózati hiba.');
        } finally {
            setLoading(false);
        }
    };

    if (!project) return <div className="container p-4">Betöltés...</div>;

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '800px' }}>
            <button className="btn btn-secondary mb-3" onClick={() => navigate(`/projects/${id}`)}>
                &larr; Vissza a projekthez
            </button>

            <h2>Anyagfelhasználás Jelentése</h2>
            <p className="text-muted">Projekt: <strong>{project.name}</strong> ({project.address})</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card p-4">
                <h4>Saját Készletem</h4>
                {myStock.length === 0 ? (
                    <p>Nincs elérhető anyag a készletedben.</p>
                ) : (
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Anyag</th>
                                <th>Elérhető</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myStock.map(m => (
                                <tr key={m.id}>
                                    <td>{m.name}</td>
                                    <td>{m.stock} {m.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <hr />

                <h4>Felhasznált Anyagok</h4>
                {itemsToUse.map((item, index) => (
                    <div key={index} className="d-flex gap-2 mb-2 align-items-end">
                        <div style={{ flex: 2 }}>
                            <label>Anyag</label>
                            <select
                                className="form-control"
                                value={item.material_id}
                                onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                            >
                                <option value="">Válassz...</option>
                                {myStock.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.stock} {m.unit})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Mennyiség ({item.unit})</label>
                            <input
                                type="number"
                                className="form-control"
                                min="1"
                                max={item.max}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            />
                        </div>
                        <button className="btn btn-danger" onClick={() => handleRemoveItem(index)}>X</button>
                    </div>
                ))}

                <button className="btn btn-outline-primary mt-2" onClick={handleAddItem}>
                    + Anyag hozzáadása
                </button>

                <div className="mt-4">
                    <label>Megjegyzés</label>
                    <textarea
                        className="form-control"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Pl. extra szigetelés kellett..."
                    />
                </div>

                <div className="d-flex justify-content-end mt-4">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSubmit}
                        disabled={loading || itemsToUse.length === 0}
                    >
                        {loading ? 'Mentés...' : 'Jelentés Beküldése'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectUsage;
