import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../context/AppContext';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    const { isOnline } = useApp();
    const { user, logout } = useAuth();

    return (
        <div className="main-layout">
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <Link to="/" className="logo">
                            <h1>{user?.company_name || 'BO-ZSO Padlásfödém Szigetelés'}</h1>
                        </Link>
                        <nav className="nav">
                            <Link to="/" className="nav-link">Kezdőlap</Link>
                            <Link to="/new-project" className="nav-link">Új Projekt</Link>

                            <div className="nav-dropdown">
                                <div className="nav-link dropdown-trigger">
                                    Raktár <span>▼</span>
                                </div>
                                <div className="dropdown-content">
                                    <Link to="/inventory" className="dropdown-item">Készlet</Link>
                                    <Link to="/handover" className="dropdown-item">Anyagkiadás</Link>
                                    <Link to="/pending-handovers" className="dropdown-item">Átvétel</Link>
                                    <Link to="/stock-history" className="dropdown-item">Mozgások</Link>
                                </div>
                            </div>

                            <Link to="/handovers-history" className="nav-link">Dokumentumok</Link>
                            {user?.role === 'admin' && (
                                <>
                                    <Link to="/invite" className="nav-link">Meghívás</Link>
                                    <Link to="/admin" className="nav-link">Admin</Link>
                                </>
                            )}
                            <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                Kilépés
                            </button>
                        </nav>
                        <div className="user-display" style={{ color: 'white', marginRight: '10px' }}>
                            <small>Bejelentkezve:</small><br />
                            <strong>{user?.full_name || user?.email}</strong>
                        </div>
                        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? '🟢 Online' : '🔴 Offline'}
                        </div>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="container">
                    {children}
                </div>
            </main>

            <footer className="footer">
                <div className="container">
                    <p>&copy; 2025 BO-ZSO Hungary Kft - Minden jog fenntartva (v28 - Email Warning Removed)</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
