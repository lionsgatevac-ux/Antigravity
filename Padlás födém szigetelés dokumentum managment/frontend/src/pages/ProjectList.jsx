import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatDate, formatCurrency } from '../utils/calculations';
import './ProjectList.css';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { showToast } = useApp();

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
            showToast('Hiba a projektek betöltésekor', 'error');
            console.error(error);
        } finally {
            setLoading(false);
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
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="project-card card"
                        >
                            <div className="project-header">
                                <h3>{project.contract_number}</h3>
                                {getStatusBadge(project.status)}
                            </div>

                            <div className="project-info">
                                <div className="info-row">
                                    <span className="label">Ügyfél:</span>
                                    <span className="value">{project.customer_name || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Terület:</span>
                                    <span className="value">{project.net_area ? `${project.net_area} m²` : 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Létrehozva:</span>
                                    <span className="value">{formatDate(project.created_at)}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;
