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
                            <Link to="/projects" className="nav-link">Projektek</Link>
                            {user?.role === 'admin' && (
                                <>
                                    <Link to="/invite" className="nav-link">Meghívás</Link>
                                    <Link to="/admin" className="nav-link">Admin</Link>
                                </>
                            )}
                            <button onClick={logout} className="nav-link text-red-400 hover:text-red-300 ml-4">
                                Kilépés
                            </button>
                        </nav>
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
                    <p>&copy; 2025 BO-ZSO Hungary Kft - Minden jog fenntartva</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
