import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Box,
    Hammer,
    Truck,
    AlertCircle,
    Calendar,
    Search,
    FileText
} from 'lucide-react';

const StockHistory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/inventory/transactions');
                if (response.success) {
                    setTransactions(response.data);
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Filter transactions
    const filteredTransactions = transactions.filter(t =>
        t.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeConfig = (type) => {
        switch (type) {
            case 'RESTOCK':
                return {
                    label: 'Bevételezés',
                    icon: <Box size={18} />,
                    className: 'text-success bg-success-subtle border-success-subtle'
                };
            case 'HANDOVER':
                return {
                    label: 'Kiadás',
                    icon: <Truck size={18} />,
                    className: 'text-warning-emphasis bg-warning-subtle border-warning-subtle'
                };
            case 'USAGE':
                return {
                    label: 'Felhasználás',
                    icon: <Hammer size={18} />,
                    className: 'text-primary bg-primary-subtle border-primary-subtle'
                };
            case 'CORRECTION':
                return {
                    label: 'Korrekció',
                    icon: <AlertCircle size={18} />,
                    className: 'text-secondary bg-secondary-subtle border-secondary-subtle'
                };
            default:
                return {
                    label: type,
                    icon: <AlertCircle size={18} />,
                    className: 'text-dark bg-light border-light'
                };
        }
    };

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('hu-HU'),
            time: d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="container-fluid p-4 bg-light min-vh-100">
            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white p-4 border-bottom-0">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h2 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                                <FileText className="text-primary" />
                                Anyagmozgás Napló
                            </h2>
                            <p className="text-muted mb-0">Raktárkészlet változásainak és mozgásainak története</p>
                        </div>
                        <div className="d-flex gap-3 align-items-center">
                            <div className="position-relative">
                                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                                <input
                                    type="text"
                                    className="form-control rounded-pill ps-5"
                                    placeholder="Keresés..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ maxWidth: '250px' }}
                                />
                            </div>
                            <button onClick={() => navigate('/inventory')} className="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-2">
                                <ArrowLeft size={18} />
                                Vissza
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Betöltés...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0">Időpont</th>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0">Típus</th>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0">Anyag</th>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0 text-end">Mennyiség</th>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0">Mozgás iránya</th>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0">Projekt</th>
                                        <th className="px-4 py-3 text-uppercase small text-muted fw-bold border-0">Megjegyzés</th>
                                    </tr>
                                </thead>
                                <tbody className="border-top-0">
                                    {filteredTransactions.map(t => {
                                        const typeConfig = getTypeConfig(t.transaction_type);
                                        const { date, time } = formatDate(t.created_at);

                                        return (
                                            <tr key={t.id} className="border-bottom">
                                                <td className="px-4 py-3">
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold text-dark">{date}</span>
                                                        <span className="small text-muted d-flex align-items-center gap-1">
                                                            <Calendar size={12} /> {time}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`badge rounded-pill d-inline-flex align-items-center gap-1 px-3 py-2 border ${typeConfig.className}`}>
                                                        {typeConfig.icon}
                                                        {typeConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3" style={{ maxWidth: '300px' }}>
                                                    <div className="fw-bold text-dark text-wrap">{t.material_name}</div>
                                                    <div className="small text-muted">{t.unit}</div>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <span className={`fw-bold fs-5 ${t.quantity_change > 0 ? 'text-success' : t.quantity_change < 0 ? 'text-danger' : 'text-dark'}`}>
                                                        {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {t.transaction_type === 'HANDOVER' && (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="text-end">
                                                                <div className="fw-bold">{t.sender_name}</div>
                                                                <small className="text-muted">Küldő</small>
                                                            </div>
                                                            <ArrowRight className="text-muted" size={16} />
                                                            <div>
                                                                <div className="fw-bold">{t.recipient_name}</div>
                                                                <small className="text-muted">Átvevő</small>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {t.transaction_type === 'USAGE' && (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="text-end">
                                                                <div className="fw-bold">{t.sender_name}</div>
                                                                <small className="text-muted">Felhasználó</small>
                                                            </div>
                                                            <ArrowRight className="text-primary" size={16} />
                                                            <div className="text-primary fw-bold">Projekt</div>
                                                        </div>
                                                    )}
                                                    {t.transaction_type === 'RESTOCK' && (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="badge bg-success-subtle text-success">Raktár</div>
                                                            <ArrowRight className="text-success" size={16} />
                                                            <div className="fw-bold">{t.sender_name || 'Admin'}</div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {t.contract_number ? (
                                                        <div className="d-flex flex-column">
                                                            <span className="fw-bold text-primary">{t.contract_number}</span>
                                                            <span className="small text-muted">{t.customer_name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted small" style={{ maxWidth: '200px' }}>
                                                    {t.notes || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredTransactions.length === 0 && (
                                <div className="text-center p-5 text-muted">
                                    <div className="mb-2"><Search size={32} className="opacity-25" /></div>
                                    <p>Nincs a keresésnek megfelelő találat.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockHistory;
