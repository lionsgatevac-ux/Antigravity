import React, { useState, useEffect } from 'react';
import { uploadsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { Trash2, ExternalLink, Filter } from 'lucide-react';

const PhotoGallery = ({ projectId, refreshTrigger }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { showToast } = useApp();

    useEffect(() => {
        loadPhotos();
    }, [projectId, refreshTrigger]);

    const loadPhotos = async () => {
        try {
            setLoading(true);
            const response = await uploadsAPI.getPhotos(projectId);
            setPhotos(response.data || []);
        } catch (error) {
            console.error('Error loading photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPhotos = filter === 'all'
        ? photos
        : photos.filter(p => p.photo_type === filter);

    const getPhotoTypeName = (type) => {
        const types = {
            general: 'Általános',
            before: 'Előtte',
            during: 'Közben',
            after: 'Utána',
            floor_plan: 'Alaprajz'
        };
        return types[type] || type;
    };

    if (loading && photos.length === 0) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (photos.length === 0) {
        return (
            <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Még nincsenek feltöltött fotók a projekthez.</p>
            </div>
        );
    }

    return (
        <div className="photo-gallery" style={{ marginTop: '20px' }}>
            <div className="gallery-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>🖼️ Projekt Galéria ({photos.length})</h3>
                <div className="gallery-filters" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Filter size={16} color="#666" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="btn btn-secondary"
                        style={{ height: '35px', padding: '0 8px', fontSize: '0.9rem' }}
                    >
                        <option value="all">Összes típusa</option>
                        <option value="before">Előtte</option>
                        <option value="during">Közben</option>
                        <option value="after">Utána</option>
                        <option value="floor_plan">Alaprajz</option>
                        <option value="general">Márka / Általános</option>
                    </select>
                </div>
            </div>

            <div className="photos-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '15px'
            }}>
                {filteredPhotos.map((photo) => (
                    <div key={photo.id} className="photo-card" style={{
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        backgroundColor: 'white',
                        position: 'relative'
                    }}>
                        <div className="photo-wrapper" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                            <img
                                src={`http://localhost:3000${photo.file_url}`}
                                alt={photo.photo_type}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => window.open(`http://localhost:3000${photo.file_url}`, '_blank')}
                            />
                        </div>
                        <div className="photo-info" style={{ padding: '8px', fontSize: '0.8rem' }}>
                            <span className={`status-badge status-${photo.photo_type}`} style={{ fontSize: '0.7rem' }}>
                                {getPhotoTypeName(photo.photo_type)}
                            </span>
                        </div>
                        <div className="photo-actions" style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            display: 'flex',
                            gap: '5px'
                        }}>
                            <button
                                onClick={() => window.open(`http://localhost:3000${photo.file_url}`, '_blank')}
                                style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px' }}
                                title="Megnyitás"
                            >
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PhotoGallery;
