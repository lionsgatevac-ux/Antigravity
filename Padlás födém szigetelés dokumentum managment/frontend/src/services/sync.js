import { getPendingSync, clearSyncedItems } from './db';
import { projectsAPI, uploadsAPI } from './api';

// Sync offline data to server
export const syncOfflineData = async () => {
    try {
        const pendingItems = await getPendingSync();

        if (pendingItems.length === 0) {
            console.log('No pending items to sync');
            return;
        }

        console.log(`Syncing ${pendingItems.length} items...`);
        const syncedIds = [];

        for (const item of pendingItems) {
            try {
                switch (item.type) {
                    case 'project':
                        await projectsAPI.create(item.data);
                        syncedIds.push(item.id);
                        break;

                    case 'photo':
                        const formData = new FormData();
                        formData.append('photo', item.data.file);
                        formData.append('projectId', item.data.projectId);
                        formData.append('photoType', item.data.photoType);
                        await uploadsAPI.uploadPhoto(formData);
                        syncedIds.push(item.id);
                        break;

                    default:
                        console.warn('Unknown sync type:', item.type);
                }
            } catch (error) {
                console.error(`Failed to sync item ${item.id}:`, error);
            }
        }

        // Clear successfully synced items
        if (syncedIds.length > 0) {
            await clearSyncedItems(syncedIds);
            console.log(`Successfully synced ${syncedIds.length} items`);
        }

        return syncedIds.length;
    } catch (error) {
        console.error('Sync error:', error);
        throw error;
    }
};

export default syncOfflineData;
