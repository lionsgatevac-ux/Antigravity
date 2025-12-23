import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { uploadsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const BulkPhotoUploader = ({ projectId, onUploadSuccess }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [photoType, setPhotoType] = useState('general');
    const fileInputRef = useRef(null);
    const { showToast } = useApp();

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit to 20 files
        const newFiles = [...selectedFiles, ...files].slice(0, 20);
        setSelectedFiles(newFiles);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews].slice(0, 20));
    };

    const removeFile = (index) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            showToast('Nincs kiválasztott fájl', 'warning');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('photoType', photoType);

            selectedFiles.forEach(file => {
                formData.append('photos', file);
            });

            await uploadsAPI.uploadPhotosBulk(formData);
            showToast(`${selectedFiles.length} fotó sikeresen feltöltve`, 'success');

            // Clear state
            setSelectedFiles([]);
            previews.forEach(url => URL.revokeObjectURL(url));
            setPreviews([]);
            if (fileInputRef.current) fileInputRef.current.value = '';

            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Hiba a feltöltés során', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bulk-photo-uploader card" style={{ marginTop: '20px' }}>
            <h3>📷 Fotók Feltöltése</h3>

            <div className="uploader-controls" style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value)}
                    className="btn btn-secondary"
                    style={{ height: '40px', padding: '0 10px' }}
                >
                    <option value="general">Általános</option>
                    <option value="before">Munkavégzés előtt</option>
                    <option value="during">Munkavégzés közben</option>
                    <option value="after">Munkavégzés után</option>
                    <option value="floor_plan">Alaprajz / Vázlat</option>
                </select>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ImageIcon size={18} /> Fájlok kiválasztása
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.length === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {uploading ? <div className="spinner-small"></div> : <Upload size={18} />}
                    {uploading ? 'Feltöltés...' : `Feltöltés (${selectedFiles.length})`}
                </button>
            </div>

            {previews.length > 0 && (
                <div className="previews-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '10px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                }}>
                    {previews.map((url, index) => (
                        <div key={index} className="preview-item" style={{ position: 'relative', aspectRatio: '1' }}>
                            <img
                                src={url}
                                alt="preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <button
                                onClick={() => removeFile(index)}
                                style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BulkPhotoUploader;
