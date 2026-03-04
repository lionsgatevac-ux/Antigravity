import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { formatDate, formatCurrency } from '../utils/calculations';
import './ProjectList.css';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { showToast } = useApp();
    const { user } = useAuth(); // Get user from AuthContext
    console.log('Current user in ProjectList:', user); // DEBUG LOG
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, [filter]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const filters = filter !== 'all' ? { status: filter } : {};
            const response = await projectsAPI.getAll(filters);
            setProjects(response.data || []);
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Hiba a projektek betöltésekor';
            showToast(errorMessage, 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id, contractNumber) => {
        e.preventDefault(); // Biztonság kedvéért
        e.stopPropagation(); // Fontos: ne hívódjon meg a kártya onClick-je

        if (window.confirm(`Biztosan törölni szeretnéd a(z) ${contractNumber} számú projektet? Ez a művelet nem vonható vissza!`)) {
            try {
                await projectsAPI.delete(id);
                setProjects(projects.filter(p => p.id !== id));
                showToast('Projekt sikeresen törölve', 'success');
            } catch (error) {
                console.error('Törlési hiba:', error);
                showToast('Hiba a projekt törlésekor', 'error');
            }
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { label: 'Tervezet', class: 'status-draft' },
            in_progress: { label: 'Folyamatban', class: 'status-progress' },
            completed: { label: 'Befejezett', class: 'status-completed' },
            signed: { label: 'Aláírt', class: 'status-signed' }
        };
        const badge = badges[status] || badges.draft;
        return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Projektek betöltése...</p>
            </div>
        );
    }

    return (
        <div className="project-list">
            <div className="page-header">
                <h1>Projektek</h1>
                <Link to="/new-project" className="btn btn-primary">
                    ➕ Új Projekt
                </Link>
            </div>

            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Összes
                </button>
                <button
                    className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
                    onClick={() => setFilter('draft')}
                >
                    Tervezet
                </button>
                <button
                    className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setFilter('in_progress')}
                >
                    Folyamatban
                </button>
                <button
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Befejezett
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">📋</div>
                    <h3>Nincs megjeleníthető projekt</h3>
                    <p>Kezdj el egy új projektet a fenti gombbal!</p>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="project-card card"
                            style={{ cursor: 'pointer' }} // Ensure pointer cursor
                        >
                            <div className="project-header">
                                <h3>{project.contract_number}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {getStatusBadge(project.status)}
                                    {user?.role === 'admin' && (
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDelete(e, project.id, project.contract_number)}
                                            title="Projekt törlése"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>



                            <div className="project-info">
                                <div className="info-row">
                                    <span className="label">Ügyfél:</span>
                                    <span className="value">
                                        {project.customer_name || 'N/A'}
                                        {(() => {
                                            const missing = [];
                                            if (!project.customer_name) missing.push('Név');
                                            // if (!project.customer_email) missing.push('Email'); // Email nem kulcsfontosságú
                                            if (!project.customer_phone) missing.push('Telefon');
                                            if (!project.customer_city || !project.customer_street) missing.push('Lakcím');
                                            if (!project.net_area) missing.push('Terület');
                                            if (!project.has_floor_plan) missing.push('Alaprajz');
                                            if (!project.customer_signature_data) missing.push('Aláírás');

                                            if (missing.length > 0) {
                                                return (
                                                    <span
                                                        style={{ color: '#f59e0b', marginLeft: '8px', cursor: 'help', fontSize: '1.1em' }}
                                                        title={`Hiányzó adatok: ${missing.join(', ')}`}
                                                    >
                                                        ⚠️
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Lakcím:</span>
                                    <span className="value" style={{ fontSize: '0.9em' }}>
                                        {project.customer_city ?
                                            `${project.customer_postal_code || ''} ${project.customer_city}, ${project.customer_street || ''} ${project.customer_house_number || ''}`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Terület:</span>
                                    <span className="value">{project.net_area ? `${project.net_area} m²` : 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Létrehozva:</span>
                                    <span className="value">{formatDate(project.created_at)}</span>
                                </div>
                                {project.owner_company && (
                                    <div className="info-row">
                                        <span className="label">Kivitelező:</span>
                                        <span className="value text-blue-400">{project.owner_company}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;
