import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
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
        const message = error.response?.data?.error?.message || error.message;
        console.error('API Error:', message);
        return Promise.reject(new Error(message));
    }
);

// Projects API
export const projectsAPI = {
    getAll: (filters) => api.get('/projects', { params: filters }),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    bulkUpdate: (data) => api.put('/projects/bulk-status', data),
    delete: (id) => api.delete(`/projects/${id}`),
    exportProject: (id) => `${API_URL}/projects/${id}/export`,
    saveSignature: (id, data) => api.put(`/projects/${id}/signature`, data)
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
    generate: (projectId, documentType) =>
        api.post('/documents/generate', { projectId, documentType }),
    download: (fileName) =>
        `${API_URL}/documents/download/${fileName}`
};

// Uploads API
export const uploadsAPI = {
    uploadPhoto: (formData) =>
        api.post('/uploads/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    uploadPhotosBulk: (formData) =>
        api.post('/uploads/photos/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    uploadSignature: (formData) =>
        api.post('/uploads/signature', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    getPhotos: (projectId) =>
        api.get(`/uploads/photos/${projectId}`)
};

// Stats API
export const statsAPI = {
    getMonthly: () => api.get('/stats/monthly'),
    getOverview: () => api.get('/stats/overview')
};

export default api;
