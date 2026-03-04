import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import SignaturePad from 'signature_pad';

const SignatureModal = ({ isOpen, onClose, onSave, title }) => {
    const canvasRef = useRef(null);
    const signaturePadRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Initialize SignaturePad
    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;

            // Removed initial sizing logic as it is now handled by resizeCanvas
            // const ratio = Math.max(window.devicePixelRatio || 1, 1);
            // canvas.width = canvas.offsetWidth * ratio;
            // canvas.height = canvas.offsetHeight * ratio;
            // canvas.getContext("2d").scale(ratio, ratio);

            // Initialize library
            const signaturePad = new SignaturePad(canvas, {
                minWidth: 0.5,
                maxWidth: 2.5,
                penColor: '#003AAE', // Ink Blue
                backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent
                velocityFilterWeight: 0.7,
            });

            signaturePadRef.current = signaturePad;

            // Track if empty
            signaturePad.addEventListener("beginStroke", () => setIsEmpty(false));
            // signaturePad.addEventListener("endStroke", () => {});

            // Handle resize with ResizeObserver
            const resizeCanvas = () => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                const data = signaturePad.toData(); // Preserve data

                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);

                signaturePad.clear();
                signaturePad.fromData(data);
            };

            // Initial call
            resizeCanvas();

            // Resize observer to handle responsiveness
            const resizeObserver = new ResizeObserver(() => {
                resizeCanvas();
            });
            resizeObserver.observe(canvas);

            return () => {
                signaturePad.off();
                resizeObserver.disconnect();
            };
        }
    }, [isOpen]);

    const clearCanvas = () => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clear();
            setIsEmpty(true);
        }
    };

    const trimCanvas = (canvas) => {
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = pixels.data.length;
        const bound = { top: null, left: null, right: null, bottom: null };
        let x, y;

        for (let i = 0; i < l; i += 4) {
            // Threshold filter: ignore very faint pixels (noise)
            if (pixels.data[i + 3] > 10) {
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
        const padding = 25; // Increased from 10 to ensure strokes aren't cut off
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
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            const canvas = canvasRef.current;
            // Trim the canvas to remove whitespace
            const trimmedCanvas = trimCanvas(canvas);
            const dataURL = trimmedCanvas.toDataURL('image/png');
            onSave(dataURL);
            onClose();
            clearCanvas();
        }
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
                        disabled={isEmpty}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#16a34a', // Green-600
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: !isEmpty ? 'pointer' : 'not-allowed',
                            flex: 1,
                            justifyContent: 'center',
                            fontWeight: 600,
                            opacity: !isEmpty ? 1 : 0.5
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
