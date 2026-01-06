import React, { useState, useRef, useEffect } from 'react';
import { PenTool, X, Check, Trash2 } from 'lucide-react';

const SignatureModal = ({ isOpen, onClose, onSave, title }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Set canvas size based on visual size
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.floor(rect.width);
            canvas.height = Math.floor(rect.height);

            ctx.strokeStyle = '#526683'; // Blue-grey to match contractor
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [isOpen]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');

        setIsDrawing(true);
        setHasSignature(true);
        ctx.beginPath();

        // Handle both mouse and touch events
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (clientX && clientY) {
            ctx.moveTo(clientX - rect.left, clientY - rect.top);
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (clientX && clientY) {
            ctx.lineTo(clientX - rect.left, clientY - rect.top);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.closePath();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const trimCanvas = (canvas) => {
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = pixels.data.length;
        const bound = { top: null, left: null, right: null, bottom: null };
        let x, y;

        for (let i = 0; i < l; i += 4) {
            if (pixels.data[i + 3] !== 0) {
                x = (i / 4) % canvas.width;
                y = Math.floor((i / 4) / canvas.width);

                if (bound.top === null) bound.top = y;
                if (bound.left === null) bound.left = x;
                else if (x < bound.left) bound.left = x;

                if (bound.right === null) bound.right = x;
                else if (x > bound.right) bound.right = x;

                if (bound.bottom === null) bound.bottom = y;
                else if (y > bound.bottom) bound.bottom = y;
            }
        }

        if (bound.top === null) return canvas; // Empty canvas

        const trimWidth = bound.right - bound.left + 1;
        const trimHeight = bound.bottom - bound.top + 1;

        // Add padding
        const padding = 10;
        const finalWidth = trimWidth + (padding * 2);
        const finalHeight = trimHeight + (padding * 2);

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = finalWidth;
        trimmedCanvas.height = finalHeight;
        const trimmedCtx = trimmedCanvas.getContext('2d');

        trimmedCtx.drawImage(
            canvas,
            bound.left, bound.top, trimWidth, trimHeight,
            padding, padding, trimWidth, trimHeight
        );

        return trimmedCanvas;
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        const trimmedCanvas = trimCanvas(canvas);
        const signatureData = trimmedCanvas.toDataURL('image/png');
        onSave(signatureData);
        onClose();
        clearCanvas();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: '42rem',
                padding: '1.5rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{title || 'Aláírás'}</h2>
                    <button
                        onClick={() => {
                            onClose();
                            clearCanvas();
                        }}
                        style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '0.5rem',
                            cursor: 'crosshair',
                            width: '100%',
                            height: '300px',
                            backgroundColor: '#f9fafb',
                            touchAction: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={clearCanvas}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <Trash2 size={18} />
                        Törlés
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasSignature}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#16a34a', // Green-600
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: hasSignature ? 'pointer' : 'not-allowed',
                            flex: 1,
                            justifyContent: 'center',
                            fontWeight: 600,
                            opacity: hasSignature ? 1 : 0.5
                        }}
                    >
                        <Check size={18} />
                        Mentés és elhelyezés
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
