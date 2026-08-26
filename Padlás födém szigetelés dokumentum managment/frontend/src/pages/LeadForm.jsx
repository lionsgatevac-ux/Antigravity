import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Home, User, Mail, Phone, MapPin } from 'lucide-react';

const LeadForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        postal_code: '',
        city: '',
        street: '',
        house_number: '',
        msg: '',
        // We'll use the same address for property for now to keep it simple
        property_postal_code: '',
        property_city: '',
        property_street: '',
        property_house_number: '',
        hrsz: '',
        area_size: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/public/lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Hiba történt a küldés során');
            }

            setSuccess(true);
            setFormData({
                name: '',
                email: '',
                phone: '',
                postal_code: '',
                city: '',
                street: '',
                house_number: '',
                msg: '',
                property_postal_code: '',
                property_city: '',
                property_street: '',
                property_house_number: '',
                hrsz: '',
                area_size: ''
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.successHeader}>
                        <CheckCircle size={64} color="#4CAF50" />
                        <h2 style={styles.title}>Köszönjük érdeklődését!</h2>
                    </div>
                    <p style={styles.text}>
                        Sikeresen megkaptuk az adatait. Hamarosanfelvesszük Önnel a kapcsolatot.
                    </p>
                    <button
                        onClick={() => setSuccess(false)}
                        style={styles.button}
                    >
                        Új ajánlatkérés
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <Home size={32} color="#2563EB" />
                    <h1 style={styles.title}>Ajánlatkérés</h1>
                    <p style={styles.subtitle}>Padlásfödém szigetelés</p>
                </div>

                {error && (
                    <div style={styles.errorAlert}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}><User size={18} /> Személyes adatok</h3>
                        <div style={styles.grid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Teljes név *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="Kovács János"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Email cím *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="janos@example.com"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Telefonszám *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="+36 30 123 4567"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}><MapPin size={18} /> Ingatlan címe</h3>
                        <div style={styles.grid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Irányítószám</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="1234"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Település</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="Budapest"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Utca, házszám</label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="Kossuth utca 12."
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}><Home size={18} /> Ingatlan adatok (Opcionális)</h3>
                        <div style={styles.grid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Becsült felület (m²)</label>
                                <input
                                    type="number"
                                    name="area_size"
                                    value={formData.area_size}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="100"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Helyrajzi szám</label>
                                <input
                                    type="text"
                                    name="hrsz"
                                    value={formData.hrsz}
                                    onChange={handleChange}
                                    style={styles.input}
                                    placeholder="1234/5"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Küldés folyamatban...' : (
                            <>
                                <Send size={18} style={{ marginRight: '8px' }} /> Ajánlatkérés küldése
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '20px',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '600px',
        padding: '32px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        margin: 0
    },
    subtitle: {
        fontSize: '16px',
        color: '#6B7280',
        margin: 0
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151'
    },
    input: {
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    button: {
        backgroundColor: '#2563EB',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        marginTop: '16px'
    },
    errorAlert: {
        backgroundColor: '#FEE2E2',
        color: '#B91C1C',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px'
    },
    successHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px'
    },
    text: {
        textAlign: 'center',
        color: '#4B5563',
        marginBottom: '24px'
    }
};

export default LeadForm;
