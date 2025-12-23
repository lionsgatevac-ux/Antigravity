import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home">
            <div className="hero">
                <h1 className="hero-title">Padlásfödém Szigetelés</h1>
                <p className="hero-subtitle">Dokumentum Menedzsment Rendszer</p>
                <p className="hero-description">
                    Professzionális megoldás padlásfödém szigetelési projektek kezelésére,
                    dokumentumok generálására és offline adatgyűjtésre.
                </p>
                <div className="hero-actions">
                    <Link to="/new-project" className="btn btn-primary btn-lg">
                        ➕ Új Projekt Indítása
                    </Link>
                    <Link to="/projects" className="btn btn-secondary btn-lg">
                        📋 Projektek Megtekintése
                    </Link>
                </div>
            </div>

            <div className="features">
                <div className="feature-card card">
                    <div className="feature-icon">📝</div>
                    <h3>Adatgyűjtés</h3>
                    <p>Multi-step űrlap ügyfél, ingatlan és műszaki adatok rögzítésére</p>
                </div>

                <div className="feature-card card">
                    <div className="feature-icon">📄</div>
                    <h3>DOCX Generálás</h3>
                    <p>Automatikus dokumentum kitöltés szerződésekhez és jegyzőkönyvekhez</p>
                </div>

                <div className="feature-card card">
                    <div className="feature-icon">📸</div>
                    <h3>Fotódokumentáció</h3>
                    <p>Képek rögzítése és tárolása projekt állapotokról</p>
                </div>

                <div className="feature-card card">
                    <div className="feature-icon">✍️</div>
                    <h3>Digitális Aláírás</h3>
                    <p>Aláírások rögzítése és mentése dokumentumokhoz</p>
                </div>

                <div className="feature-card card">
                    <div className="feature-icon">📊</div>
                    <h3>Admin Dashboard</h3>
                    <p>Projektek kezelése, statisztikák és összesítők</p>
                </div>

                <div className="feature-card card">
                    <div className="feature-icon">🔄</div>
                    <h3>Offline Mód</h3>
                    <p>Működik internet nélkül, automatikus szinkronizálás</p>
                </div>
            </div>

            <div className="company-info card">
                <h2>BO-ZSO Hungary Kft</h2>
                <div className="info-grid">
                    <div>
                        <strong>Cím:</strong> 2133 Sződliget HRSZ 1225/1
                    </div>
                    <div>
                        <strong>Email:</strong> lionsgatevac@gmail.com
                    </div>
                    <div>
                        <strong>Adószám:</strong> 27030110213
                    </div>
                    <div>
                        <strong>Cégjegyzékszám:</strong> 13 09 201060
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
