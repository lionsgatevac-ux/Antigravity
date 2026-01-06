import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api'; // Import api instance

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set base URL (global axios) - keep for auth calls
    axios.defaults.baseURL = 'http://localhost:3000';

    // Configure headers & interceptors
    useEffect(() => {
        // 1. Set Auth Header for both global axios and api instance
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            delete api.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }

        // 2. Define Interceptor Logic
        const handle401 = (error) => {
            if (error.response && error.response.status === 401) {
                console.warn('401 Unauthorized - Logging out');
                logout();
            }
            return Promise.reject(error);
        };

        // 3. Attach Interceptors to both instances
        // We use response interceptors
        // Note: api.js already has its own interceptors, but we can add another one.
        // Multiple interceptors run in order.
        const globalInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => handle401(error)
        );

        const apiInterceptor = api.interceptors.response.use(
            (response) => response,
            (error) => handle401(error) // api.js already unwraps response.data, but error handling is similar
        );

        // 4. Cleanup
        return () => {
            axios.interceptors.response.eject(globalInterceptor);
            api.interceptors.response.eject(apiInterceptor);
        };
    }, [token]);

    // Check if user is logged in (verify token or decode it)
    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // If we want to verify user from backend, we can fetch /api/auth/me
                // For now, we decode token or just assume valid if we trust localStorage
                // But better to persist user object or decode JWT
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (err) {
                console.error("Failed to load user", err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // Login Action
    const login = async (email, password) => {
        setError(null);
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            const { token, user } = res.data.data;

            // Only allow contractor/external (admin logic can be added later)
            // But since I'm Admin, I need to login too. Backend handles role.

            setToken(token);
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        } catch (err) {
            console.error("Login fail", err.response?.data?.error);
            setError(err.response?.data?.error || 'Login failed');
            return false;
        }
    };

    // Register Action
    const register = async (formData) => {
        setError(null);
        try {
            const res = await axios.post('/api/auth/register', formData);
            const { token, user } = res.data.data;

            setToken(token);
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        } catch (err) {
            console.error("Register fail", err.response?.data?.error);
            setError(err.response?.data?.error || 'Registration failed');
            return false;
        }
    };

    // Logout Action
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    // Invite User Action (Admin only) // ADDED
    const inviteUser = async (email, role, fullName) => {
        setError(null);
        try {
            const res = await axios.post('/api/auth/invite', { email, role, full_name: fullName });
            return { success: true, message: res.data.message, previewUrl: res.data.previewUrl };
        } catch (err) {
            console.error("Invite fail", err.response?.data?.error);
            setError(err.response?.data?.error || 'Invitation failed');
            return { success: false, error: err.response?.data?.error || 'Invitation failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, inviteUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);
