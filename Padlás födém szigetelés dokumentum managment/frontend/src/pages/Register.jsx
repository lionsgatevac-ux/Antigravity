import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const { register, error } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Role state
    const [role, setRole] = useState('contractor'); // 'contractor' | 'external'

    // Form data
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        company_name: '',
        company_address: '',
        company_tax_number: '',
        company_reg_number: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Always register as 'external' (creates new Org)
        const success = await register({ ...formData, role: 'external' });
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white py-10">
            <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-500">Regisztráció</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-gray-700/30 p-4 rounded mb-6 text-sm text-gray-300">
                    <p>ℹ️ Regisztráció új cégként. Saját szervezetet hozunk létre, ahol Ön lesz az adminisztrátor. Alvállalkozókat a belépés után tud meghívni.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Teljes Név</label>
                            <input
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email cím</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Jelszó</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <h3 className="text-xl font-semibold mt-6 pt-4 border-t border-gray-700">Cég Adatok</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">Cég Neve</label>
                        <input
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder="Pl. Kovács Kft."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Cég Címe</label>
                        <input
                            name="company_address"
                            value={formData.company_address}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder="2133 Sződliget, Fő út 1."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Adószám</label>
                            <input
                                name="company_tax_number"
                                value={formData.company_tax_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cégjegyzékszám</label>
                            <input
                                name="company_reg_number"
                                value={formData.company_reg_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 mt-6 rounded font-bold transition-colors disabled:opacity-50 ${role === 'external' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Regisztráció...' : 'Regisztráció'}
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-400">
                    Már van fiókod?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300">
                        Belépés
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
