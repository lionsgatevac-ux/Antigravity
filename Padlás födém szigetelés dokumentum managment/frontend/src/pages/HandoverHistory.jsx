import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

const HandoverHistory = () => {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchHistory();
    }, [token]);

    const fetchHistory = async () => {
        try {
            const data = await api.get('/inventory/history');
            if (data.success) {
                // Group by timestamp (approximate to 1 second) and people
                const grouped = groupTransactions(data.data);
                setHistory(grouped);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupTransactions = (flatList) => {
        const groups = {};

        flatList.forEach(item => {
            // Create a key based on time (down to minute to be safe? or second?), sender, recipient
            // Since they are inserted in a transaction, created_at should be identical.
            const dateKey = new Date(item.created_at).toISOString();
            const key = `${dateKey}_${item.sender_name}_${item.recipient_name}`;

            if (!groups[key]) {
                groups[key] = {
                    date: item.created_at,
                    sender: item.sender_name,
                    recipient: item.recipient_name,
                    project: item.contract_number ? `${item.contract_number} - ${item.customer_name}` : null,
                    signature: item.signature_data,
                    items: []
                };
            }
            groups[key].items.push(item);
        });

        // Convert to array and sort desc
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    if (loading) return <div className="p-4">Betöltés...</div>;

    return (
        <div className="container p-4" style={{ maxWidth: '800px' }}>
            <h2 className="mb-4">Aláírt Dokumentumok (Átadás-átvétel)</h2>

            {history.length === 0 ? (
                <p>Nincs még rögzített átadás.</p>
            ) : (
                <div className="history-list">
                    {history.map((group, idx) => (
                        <div key={idx} className="card mb-4 shadow-sm">
                            <div className="card-header bg-light">
                                <div className="d-flex justify-content-between align-items-center">
                                    <strong>{format(new Date(group.date), 'yyyy. MM. dd. HH:mm', { locale: hu })}</strong>
                                    <span className="badge bg-success">Aláírva</span>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <small className="text-muted">Átadó:</small>
                                        <div>{group.sender || 'Ismeretlen'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted">Átvevő / Címzett:</small>
                                        <div>{group.recipient || 'Ismeretlen'}</div>
                                    </div>
                                </div>

                                {group.project && (
                                    <div className="mb-3 p-2 bg-info bg-opacity-10 rounded">
                                        <strong>Projekt:</strong> {group.project}
                                    </div>
                                )}

                                <h6 className="mt-3">Tételek:</h6>
                                <table className="table table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Anyag</th>
                                            <th>Mennyiség</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.material_name}</td>
                                                <td>{item.quantity} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-4">
                                    <h6>Aláírás:</h6>
                                    {group.signature ? (
                                        <img
                                            src={group.signature}
                                            alt="Aláírás"
                                            style={{ maxHeight: '100px', border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}
                                        />
                                    ) : (
                                        <span className="text-muted text-italic">Nincs digitális aláírás</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HandoverHistory;
