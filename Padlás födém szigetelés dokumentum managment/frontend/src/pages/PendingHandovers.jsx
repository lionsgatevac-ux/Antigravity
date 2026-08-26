import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignatureModal from '../components/SignatureModal';
import api from '../services/api'; // Import api

const PendingHandovers = () => {
    const { token } = useAuth(); // Token is injected into api by AuthContext
    const [pendingItems, setPendingItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSignature, setShowSignature] = useState(false);

    useEffect(() => {
        if (token) {
            fetchPendingItems();
        }
    }, [token]);

    const fetchPendingItems = async () => {
        try {
            const data = await api.get('/inventory/pending');
            if (data.success) {
                setPendingItems(data.data);
            }
        } catch (error) {
            console.error('Error fetching pending items:', error);
        }
    };

    const handleSelect = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === pendingItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(pendingItems.map(i => i.id));
        }
    };

    const handleAccept = async (signatureData) => {
        setLoading(true);
        try {
            const data = await api.post('/inventory/accept', {
                transactionIds: selectedItems,
                signature: signatureData
            });

            if (data.success) {
                alert('Átvétel sikeresen rögzítve!');
                setSelectedItems([]);
                setShowSignature(false);
                fetchPendingItems(); // Refresh
            } else {
                alert('Hiba: ' + (data.error || 'Ismeretlen hiba'));
            }
        } catch (error) {
            console.error('Accept error:', error);
            alert('Hiba történt az átvétel során.');
        } finally {
            setLoading(false);
        }
    };

    if (pendingItems.length === 0) {
        return (
            <div className="container" style={{ padding: '20px' }}>
                <h2>Függő Átvételek</h2>
                <div className="alert alert-info">Nincs átvételre váró tétel.</div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h2>Függő Átvételek</h2>
            <p>Az alábbi tételeket küldték neked. Jelöld ki amelyeket átveszel, és írd alá.</p>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectedItems.length === pendingItems.length && pendingItems.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th>Dátum</th>
                            <th>Küldő</th>
                            <th>Anyag</th>
                            <th>Mennyiség</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingItems.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => handleSelect(item.id)}
                                    />
                                </td>
                                <td>{new Date(item.created_at).toLocaleString()}</td>
                                <td>{item.sender_name}</td>
                                <td>{item.material_name} ({item.unit})</td>
                                <td style={{ color: 'red', fontWeight: 'bold' }}>{Math.abs(item.quantity_change)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="actions" style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-success"
                        disabled={selectedItems.length === 0 || loading}
                        onClick={() => setShowSignature(true)}
                    >
                        Kijelöltek Átvétele ({selectedItems.length})
                    </button>
                </div>
            </div>

            <SignatureModal
                isOpen={showSignature}
                onClose={() => setShowSignature(false)}
                onSave={handleAccept}
                title="Átvétel Igazolása"
            />
        </div>
    );
};

export default PendingHandovers;
