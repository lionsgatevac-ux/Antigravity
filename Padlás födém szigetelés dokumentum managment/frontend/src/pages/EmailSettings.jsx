import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import './EmailSettings.css';

const EmailSettings = () => {
    const { showToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_pass: '',
        email_from: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await adminAPI.getEmailSettings();
            if (response.success) {
                // Merge with defaults to ensure all fields exist
                setSettings(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (error) {
            console.error('Failed to load email settings:', error);
            showToast('Nem sikerült betölteni a beállításokat', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await adminAPI.saveEmailSettings(settings);
            showToast('Beállítások sikeresen mentve', 'success');
            // Reload to re-confirm (and maybe get masked password back if we want, though simpler to keep state)
        } catch (error) {
            console.error('Failed to save settings:', error);
            showToast('Hiba a mentés során', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async (e) => {
        e.preventDefault();
        if (!testEmail) {
            showToast('Adj meg egy email címet a teszteléshez!', 'warning');
            return;
        }

        setTesting(true);
        try {
            await adminAPI.sendTestEmail(testEmail);
            showToast(`Teszt email elküldve: ${testEmail}`, 'success');
        } catch (error) {
            console.error('Test email failed:', error);
            showToast('Hiba a teszt email küldésekor. Ellenőrizd a beállításokat!', 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="loading">Beállítások betöltése...</div>;
    }

    return (
        <div className="email-settings-container">
            <div className="settings-card">
                <h2>Email (SMTP) Beállítások</h2>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>SMTP Kiszolgáló (Host)</label>
                        <input
                            type="text"
                            name="smtp_host"
                            value={settings.smtp_host || ''}
                            onChange={handleChange}
                            placeholder="pl. smtp.gmail.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>SMTP Port</label>
                        <input
                            type="text"
                            name="smtp_port"
                            value={settings.smtp_port || ''}
                            onChange={handleChange}
                            placeholder="587 vagy 465"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Felhasználónév (Email)</label>
                        <input
                            type="text"
                            name="smtp_user"
                            value={settings.smtp_user || ''}
                            onChange={handleChange}
                            placeholder="email@pelda.hu"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Jelszó</label>
                        <input
                            type="password"
                            name="smtp_pass"
                            value={settings.smtp_pass || ''}
                            onChange={handleChange}
                            placeholder="SMTP Jelszó (vagy App Password)"
                        />
                        <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
                            Hagyd üresen, ha nem akarod módosítani.
                        </small>
                        <div className="info-box" style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <strong>💡 Gmail beállítás:</strong> Gmail esetén <strong>Alkalmazásjelszót (App Password)</strong> kell használnod!
                                <br />
                                <span style={{ color: '#d97706', fontWeight: 'bold' }}>⚠️ Figyelem:</span> Ehhez előbb be <u>KELL</u> kapcsolnod a <strong>Kétlépcsős azonosítást</strong> a Google fiókodban!
                                <br />
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>
                                    ➡️ App Password Generálása itt
                                </a>
                            </p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Feladó Cím (From)</label>
                        <input
                            type="text"
                            name="email_from"
                            value={settings.email_from || ''}
                            onChange={handleChange}
                            placeholder='"Cégnév" <info@ceg.hu>'
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Mentés...' : 'Beállítások Mentése'}
                    </button>
                </form>
            </div>

            <div className="test-card">
                <h3>Kapcsolat Tesztelése</h3>
                <p>Küldj egy próba e-mailt a beállítások ellenőrzéséhez.</p>
                <div className="test-input-group">
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="cimzett@pelda.hu"
                    />
                    <button onClick={handleTestEmail} className="btn btn-secondary" disabled={testing}>
                        {testing ? 'Küldés...' : 'Teszt Email Küldése'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailSettings;
