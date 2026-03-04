import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI, projectsAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import { useApp } from '../context/AppContext';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const { showToast } = useApp();
    const { logout } = useAuth(); // Import logout

    const PROFIT_RATE = 16000;

    const [monthlyStats, setMonthlyStats] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [filterType, setFilterType] = useState('all'); // all, last-week, last-month, custom
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const LOAD_ALL = 'all';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, projectsRes, monthlyRes] = await Promise.all([
                statsAPI.getOverview(),
                projectsAPI.getAll(),
                statsAPI.getMonthly()
            ]);
            setStats(statsRes.data);
            setProjects(projectsRes.data || []);
            setMonthlyStats(monthlyRes.data || []);
        } catch (error) {
            console.error('Error loading admin data:', error);
            const errMsg = error.response?.data?.error || error.message || 'Ismeretlen hiba';
            showToast(`Hiba az adatok betöltésekor: ${errMsg}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => {
        const pDate = new Date(p.created_at);
        const now = new Date();

        // 1. First apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                p.contract_number.toLowerCase().includes(term) ||
                (p.customer_name && p.customer_name.toLowerCase().includes(term)) ||
                (p.property_city && p.property_city.toLowerCase().includes(term));

            if (!matchesSearch) return false;
        }

        // 2. Then apply date filters
        if (filterType === 'all') {
            if (selectedMonth === LOAD_ALL) return true;
            const pMonth = pDate.toISOString().substring(0, 7);
            return pMonth === selectedMonth;
        }

        if (filterType === 'last-week') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            return pDate >= lastWeek && pDate <= now;
        }

        if (filterType === 'last-month') {
            const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            return pDate >= firstDayLastMonth && pDate <= lastDayLastMonth;
        }

        if (filterType === 'custom') {
            if (!customRange.start && !customRange.end) return true;
            const start = customRange.start ? new Date(customRange.start) : new Date(0);
            const end = customRange.end ? new Date(customRange.end) : new Date();
            end.setHours(23, 59, 59);
            return pDate >= start && pDate <= end;
        }

        return true;
    });

    const filteredStats = {
        ...stats,
        totalProjects: filteredProjects.length,
        totalGJ: filteredProjects.reduce((sum, p) => sum + parseFloat(p.energy_saving_gj || 0), 0),
        totalProfit: filteredProjects.reduce((sum, p) => sum + parseFloat(p.energy_saving_gj || 0), 0) * PROFIT_RATE,
        auditedProjects: filteredProjects.filter(p => p.status === 'audited').length,
        soldProjects: filteredProjects.filter(p => p.status === 'sold').length,
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(projects.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedIds.length === 0) {
            showToast('Nincs kiválasztott projekt', 'warning');
            return;
        }

        try {
            await projectsAPI.bulkUpdate({
                ids: selectedIds,
                status: newStatus
            });
            showToast(`${selectedIds.length} projekt sikeresen frissítve: ${newStatus}`, 'success');
            setSelectedIds([]);
            loadData();
        } catch (error) {
            showToast('Hiba a tömeges módosításkor', 'error');
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Tervezet',
            in_progress: 'Folyamatban',
            completed: 'Befejezett',
            signed: 'Aláírt',
            audited: 'Auditált',
            sold: 'Eladva'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Adminisztrációs adatok betöltése...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <h1>Adminisztrátori Vezérlőpult</h1>
                <div className="header-actions">
                    <Link to="/invite" className="btn btn-primary" style={{ marginRight: '1rem' }}>
                        ✉️ Új Felhasználó
                    </Link>
                    <Link to="/admin/email-settings" className="btn btn-secondary" style={{ marginRight: '1rem', backgroundColor: '#64748b', color: 'white' }}>
                        ⚙️ Email Beállítások
                    </Link>
                    <button
                        onClick={logout}
                        className="btn"
                        style={{ backgroundColor: '#ef4444', color: 'white', marginRight: 'auto' }}
                    >
                        ⚠️ Kilépés
                    </button>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-type-selector"
                    >
                        <option value="all">Időszak szerint</option>
                        <option value="last-week">Előző 7 nap</option>
                        <option value="last-month">Előző hónap</option>
                        <option value="custom">Egyedi dátum</option>
                    </select>

                    {filterType === 'all' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="month-selector"
                        >
                            <option value="all">Összes hónap</option>
                            {monthlyStats.map(m => {
                                const date = new Date(m.month);
                                const label = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
                                return <option key={m.month} value={m.month.substring(0, 7)}>{label}</option>;
                            })}
                        </select>
                    )}

                    {filterType === 'custom' && (
                        <div className="custom-date-inputs">
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                className="date-input"
                            />
                            <span>-</span>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                className="date-input"
                            />
                        </div>
                    )}

                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Keresés: Projekt #, Név, Város..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="clear-search">✕</button>}
                    </div>

                    <button onClick={loadData} className="btn btn-secondary">🔄 Frissítés</button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{filteredStats?.totalProjects || 0}</div>
                    <div className="stat-label">Projektek Száma</div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-value">{(filteredStats?.totalGJ || 0).toFixed(2)} GJ</div>
                    <div className="stat-label">Termelés (GJ)</div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">{formatCurrency(filteredStats?.totalProfit || 0)}</div>
                    <div className="stat-label">Várható Profit</div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-value">{filteredStats?.auditedProjects || 0}</div>
                    <div className="stat-label">Auditált</div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">🤝</div>
                    <div className="stat-value">{filteredStats?.soldProjects || 0}</div>
                    <div className="stat-label">Eladott</div>
                </div>
            </div>

            <div className="admin-management">
                <div className="management-header">
                    <h2>Projektek Kezelése</h2>

                    {selectedIds.length > 0 && (
                        <div className="bulk-actions">
                            <span className="bulk-label">{selectedIds.length} kijelölve:</span>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleBulkStatusUpdate('audited')}
                            >
                                ✅ Auditáltra jelöl
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => handleBulkStatusUpdate('sold')}
                                style={{ backgroundColor: '#10b981', color: 'white' }}
                            >
                                💰 Eladottra jelöl
                            </button>
                        </div>
                    )}
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        className="selection-checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === projects.length && projects.length > 0}
                                    />
                                </th>
                                <th>Szerződés Szám</th>
                                <th>Ügyfél</th>
                                <th>Település</th>
                                <th>Státusz</th>
                                <th>Termelés (GJ)</th>
                                <th>Profit (Ft)</th>
                                <th>Dátum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id} className={selectedIds.includes(project.id) ? 'selected' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="selection-checkbox"
                                            checked={selectedIds.includes(project.id)}
                                            onChange={() => handleSelectRow(project.id)}
                                        />
                                    </td>
                                    <td><strong>{project.contract_number}</strong></td>
                                    <td>{project.customer_name || 'N/A'}</td>
                                    <td>{project.property_city || 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge status-${project.status}`}>
                                            {getStatusLabel(project.status)}
                                        </span>
                                    </td>
                                    <td className="gj-column">{parseFloat(project.energy_saving_gj || 0).toFixed(2)} GJ</td>
                                    <td className="profit-column">
                                        {formatCurrency((project.energy_saving_gj || 0) * PROFIT_RATE)}
                                    </td>
                                    <td>{formatDate(project.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
