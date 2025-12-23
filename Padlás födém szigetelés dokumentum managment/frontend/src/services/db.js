import Dexie from 'dexie';

// Initialize IndexedDB database
export const db = new Dexie('PadlasSzigeteles');

db.version(1).stores({
    projects: '++id, contract_number, status, created_at',
    customers: '++id, full_name, email',
    photos: '++id, project_id, photo_type',
    pendingSync: '++id, type, data, created_at'
});

// Helper functions

// Save project offline
export const saveProjectOffline = async (projectData) => {
    try {
        const id = await db.projects.add({
            ...projectData,
            created_at: new Date(),
            synced: false
        });
        return id;
    } catch (error) {
        console.error('Error saving project offline:', error);
        throw error;
    }
};

// Get all offline projects
export const getOfflineProjects = async () => {
    try {
        return await db.projects.toArray();
    } catch (error) {
        console.error('Error getting offline projects:', error);
        return [];
    }
};

// Add to pending sync queue
export const addToPendingSync = async (type, data) => {
    try {
        await db.pendingSync.add({
            type,
            data,
            created_at: new Date()
        });
    } catch (error) {
        console.error('Error adding to pending sync:', error);
    }
};

// Get pending sync items
export const getPendingSync = async () => {
    try {
        return await db.pendingSync.toArray();
    } catch (error) {
        console.error('Error getting pending sync:', error);
        return [];
    }
};

// Clear synced items
export const clearSyncedItems = async (ids) => {
    try {
        await db.pendingSync.bulkDelete(ids);
    } catch (error) {
        console.error('Error clearing synced items:', error);
    }
};

// Save photo offline
export const savePhotoOffline = async (photoData) => {
    try {
        const id = await db.photos.add({
            ...photoData,
            created_at: new Date(),
            synced: false
        });
        return id;
    } catch (error) {
        console.error('Error saving photo offline:', error);
        throw error;
    }
};

export default db;
