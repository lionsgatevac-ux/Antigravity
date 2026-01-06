import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const { login } = useAuth(); // We might manually set token after success?

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
        fullName: '',
        companyName: '' // Optional
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus({ type: 'error', message: 'Érvénytelen vagy hiányzó meghívó token.' });
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'A jelszavak nem egyeznek!' });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await axios.post('/api/auth/accept-invite', {
                token,
                password: formData.password,
                full_name: formData.fullName,
                company_name: formData.companyName
            });

            if (res.data.success) {
                setStatus({ type: 'success', message: 'Sikeres regisztráció! Átirányítás...' });

                // Auto login mechanism via context? 
                // Context doesn't have a verifyToken method exposed, but it checks localStorage on mount.
                // We can set localStorage manually here or force reload?
                // Better: Update context state if possible. 
                // Since our context is simple, we might need a hard reload or just redirect to login if auto-login is tricky.

                localStorage.setItem('token', res.data.data.token);
                // Also need user object?
                localStorage.setItem('user', JSON.stringify(res.data.data.user));

                setTimeout(() => {
                    window.location.href = '/projects'; // Force reload to pick up auth context
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: err.response?.data?.error || 'Hiba történt a regisztráció során.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded shadow text-red-600">
                    Hiányzó token. Kérjük, kattintson az emailben kapott linkre.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Meghívás Elfogadása</h2>

                {status.message && (
                    <div className={`mb-4 p-3 rounded text-center ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.message}
                    </div>
                )}

                {!status.type.includes('success') && (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Teljes Név</label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded shadow-sm focus:ring-blue-500"
                                placeholder="Az Ön neve"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Jelszó</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded shadow-sm focus:ring-blue-500"
                                placeholder="******"
                                minLength={6}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Jelszó Megerősítése</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded shadow-sm focus:ring-blue-500"
                                placeholder="******"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-2 px-4 rounded text-white font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {isSubmitting ? 'Feldolgozás...' : 'Regisztráció Befejezése'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
