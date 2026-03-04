import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncOfflineData } from '../services/sync';

const AppContext = createContext();
// Use relative path for API calls to leverage Vite proxy
export const API_URL = '/api';
export const DIRECT_API_URL = 'http://localhost:4000/api';

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [currentProject, setCurrentProject] = useState(null);
    const [toast, setToast] = useState(null);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showToast('Kapcsolat helyreállt', 'success');
            // Sync offline data when coming back online
            syncOfflineData();
        };

        const handleOffline = () => {
            setIsOnline(false);
            showToast('Offline mód - Az adatok helyben tárolódnak', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Toast notification
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const value = {
        isOnline,
        currentProject,
        setCurrentProject,
        toast,
        showToast
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </AppContext.Provider>
    );
};
