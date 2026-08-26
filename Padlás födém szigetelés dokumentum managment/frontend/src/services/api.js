import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        let message = 'Váratlan hiba történt';
        if (error.response?.data?.error) {
            const errData = error.response.data.error;
            if (typeof errData === 'object' && errData !== null) {
                message = errData.message || 'Ismeretlen szerver hiba';
            } else {
                message = String(errData);
            }
        } else if (error.message) {
            message = error.message;
        }

        console.error('API Error:', message);
        error.message = String(message);
        return Promise.reject(error);
    }
);

// Projects API
export const projectsAPI = {
    getAll: (filters) => api.get('/projects', { params: filters }),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    fullUpdate: (id, data) => api.put(`/projects/${id}/full_update`, data),
    bulkUpdate: (data) => api.put('/projects/bulk-status', data),
    delete: (id) => api.delete(`/projects/${id}`),
    exportProject: (id) => `${API_URL}/projects/${id}/export`,
    downloadExport: (id) => api.get(`/projects/${id}/export`, { responseType: 'blob' }),
    saveSignature: (id, data) => api.put(`/projects/${id}/signature`, data),
    sendRemoteRequest: (id) => api.post(`/projects/${id}/remote-request`),
    sendDocuments: (id) => api.post(`/projects/${id}/send-documents`)
};

// Customers API
export const customersAPI = {
    getAll: () => api.get('/customers'),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`)
};

// Documents API
export const documentsAPI = {
    generate: (projectId, documentType, format) =>
        api.post('/documents/generate', { projectId, documentType, format }),
    download: (fileName) =>
        `${API_URL}/documents/download/${fileName}`
};

// Uploads API
export const uploadsAPI = {
    uploadPhoto: (formData) =>
        api.post('/uploads/photo', formData),
    uploadPhotosBulk: (formData) =>
        api.post('/uploads/photos/bulk', formData),
    uploadSignature: (formData) =>
        api.post('/uploads/signature', formData),
    getPhotos: (projectId) =>
        api.get(`/uploads/photos/${projectId}`),
    deletePhoto: (projectId, photoType) =>
        api.delete(`/uploads/photos/${projectId}/${photoType}`)
};

// Stats API
export const statsAPI = {
    getMonthly: () => api.get('/stats/monthly'),
    getOverview: () => api.get('/stats/overview')
};

// Admin API
export const adminAPI = {
    getEmailSettings: () => api.get('/admin/settings/email'),
    saveEmailSettings: (data) => api.post('/admin/settings/email', data),
    sendTestEmail: (email) => api.post('/admin/settings/test-email', { test_email: email })
};

// Remote Signature API
export const remoteAPI = {
    verify: (token) => api.get(`/remote/verify/${token}`),
    sign: (token, signatureData) => api.post(`/remote/sign/${token}`, { signatureData })
};

// Materials API
export const materialsAPI = {
    getAll: () => api.get('/materials'),
    create: (data) => api.post('/materials', data),
    delete: (id) => api.delete(`/materials/${id}`)
};

export default api;
