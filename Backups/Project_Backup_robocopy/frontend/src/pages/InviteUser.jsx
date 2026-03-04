import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const InviteUser = () => {
    const { inviteUser, user } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: 'contractor' // Default role
    });

    // UI State
    const [status, setStatus] = useState({ type: '', message: '', previewUrl: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle Input Change
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '', previewUrl: null });

        try {
            const result = await inviteUser(formData.email, formData.role, formData.fullName);

            if (result.success) {
                setStatus({
                    type: 'success',
                    message: result.message || 'Meghívó sikeresen elküldve!',
                    previewUrl: result.previewUrl
                });
                // Reset form slightly but keep role?
                setFormData(prev => ({ ...prev, email: '', fullName: '' }));
            } else {
                setStatus({ type: 'error', message: result.error });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Hiba történt a küldés során.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Protect Route (Frontend check)
    if (user && user.role !== 'admin') {
        return <div className="p-4 text-red-600">Nincs jogosultsága ezen oldal megtekintéséhez.</div>;
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Új Felhasználó Meghívása</h2>

            {status.message && (
                <div className={`mb-4 p-3 rounded ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {status.message}
                    {status.previewUrl && (
                        <div className="mt-2 text-sm">
                            <a href={status.previewUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">
                                [DEV] Email megtekintése (Ethereal)
                            </a>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Teljes Név
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Pl. Kiss János"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Email Cím <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@pelda.hu"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Szerepkör
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="contractor">Alvállalkozó (Contractor)</option>
                        <option value="admin">Adminisztrátor</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Az alvállalkozók csak a saját projektjeiket látják. Az adminisztrátorok látják a teljes szervezet projektjeit.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2 px-4 rounded text-white font-bold transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {isSubmitting ? 'Küldés...' : 'Meghívó Küldése'}
                </button>
            </form>
        </div>
    );
};

export default InviteUser;
