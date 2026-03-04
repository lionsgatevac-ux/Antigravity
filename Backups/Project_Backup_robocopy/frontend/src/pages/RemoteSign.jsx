import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { remoteAPI } from '../services/api';
import SignaturePad from 'signature_pad';
import { Check, Trash2, AlertCircle } from 'lucide-react';

const RemoteSign = () => {
    const { token } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Signature Pad refs
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const signaturePadRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await remoteAPI.verify(token);
                setProject(response.data);
            } catch (err) {
                setError('A link érvénytelen vagy lejárt.');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    useEffect(() => {
        if (!loading && !error && !success && canvasRef.current) {
            const canvas = canvasRef.current;
            // Removed local ratio declaration as it's used inside resizeCanvas now

            const signaturePad = new SignaturePad(canvas, {
                minWidth: 0.5,
                maxWidth: 2.5,
                penColor: '#003AAE', // Ink Blue
                backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent background
                velocityFilterWeight: 0.7,
            });

            signaturePadRef.current = signaturePad;
            signaturePad.addEventListener("beginStroke", () => setIsEmpty(false));

            // Handle resize with ResizeObserver for robustness
            const resizeCanvas = () => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                const data = signaturePad.toData();

                // Set width/height based on current offsetWidth/Height
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);

                signaturePad.clear();
                signaturePad.fromData(data);
            };

            // Call once immediately
            resizeCanvas();

            // Use ResizeObserver to detect container size changes
            const resizeObserver = new ResizeObserver(() => {
                resizeCanvas();
            });
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current);
            }

            return () => {
                resizeObserver.disconnect();
                signaturePad.off();
            };
        }
    }, [loading, error, success]);

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
        const threshold = 10; // Ignore faint pixels

        const bound = {
            top: null,
            left: null,
            right: null,
            bottom: null
        };
        let x, y;

        for (let i = 0; i < l; i += 4) {
            if (pixels.data[i + 3] > threshold) {
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

        if (bound.top === null) return canvas;

        const trimWidth = bound.right - bound.left + 1;
        const trimHeight = bound.bottom - bound.top + 1;

        // Symmetric padding for natural centering
        const paddingLeft = 5;
        const paddingRight = 5;
        const paddingTop = 5; // Slight top breathing room
        const paddingBottom = 0; // Tight bottom for line proximity

        const finalWidth = trimWidth + paddingLeft + paddingRight;
        const finalHeight = trimHeight + paddingTop + paddingBottom;

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = finalWidth;
        trimmedCanvas.height = finalHeight;
        const trimmedCtx = trimmedCanvas.getContext('2d');

        // trimmedCtx.fillStyle = "#ffffff";
        // trimmedCtx.fillRect(0, 0, finalWidth, finalHeight);

        trimmedCtx.drawImage(
            canvas,
            bound.left, bound.top, trimWidth, trimHeight,
            paddingLeft, paddingTop, trimWidth, trimHeight
        );

        return trimmedCanvas;
    };

    const handleSave = async () => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            if (!window.confirm("Biztosan véglegesíti az aláírást? A művelet nem visszavonható.")) {
                return;
            }

            try {
                const canvas = canvasRef.current;
                const trimmedCanvas = trimCanvas(canvas);
                const dataURL = trimmedCanvas.toDataURL('image/png');

                await remoteAPI.sign(token, dataURL);
                setSuccess(true);
            } catch (err) {
                console.error('Signature save error:', err);
                const msg = err.response?.data?.error || err.message || 'Ismeretlen hiba';
                alert(`Hiba történt a mentés során: ${msg}`);
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="spinner"></div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="card max-w-md w-full text-center">
                <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                <h2 className="mb-2">Hiba történt</h2>
                <p className="text-secondary">{error}</p>
            </div>
        </div>
    );

    if (success) return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="card max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mb-2">Sikeres Aláírás!</h2>
                <p className="text-secondary">Köszönjük, az aláírását rögzítettük.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-lg shadow-xl">

                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-primary font-bold mb-1">Elektronikus Aláírás</h3>
                    <p className="text-sm text-secondary">BO-ZSO Padlásfödém Szigetelés</p>
                </div>

                {/* Info */}
                <div className="mb-6">
                    <p className="mb-4 text-center">
                        Üdvözlöm, <strong className="text-primary">{project.full_name || 'Ügyfél'}</strong>!
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 mr-2" />
                        <p className="text-sm m-0 text-blue-800 dark:text-blue-200">
                            Az "Aláírás Beküldése" gombbal Ön elfogadja a dokumentumok tartalmát.
                        </p>
                    </div>
                </div>

                {/* Signature Pad */}
                <div className="mb-6">
                    <label className="form-label text-center mb-2 block">Kérjük, írjon alá a kereten belül:</label>
                    <div style={{ backgroundColor: '#ffffff', border: '2px dashed #9ca3af', borderRadius: '0.5rem', padding: '4px' }}>
                        <div ref={containerRef} style={{ position: 'relative', height: '224px', width: '100%', overflow: 'hidden', backgroundColor: '#ffffff', borderRadius: '0.25rem' }}>
                            <canvas
                                ref={canvasRef}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                            />
                            {isEmpty && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.2 }}>
                                    <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>Aláírás helye</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buttons - Symmetrical Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={clearCanvas}
                        className="btn btn-secondary w-full justify-center"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Törlés
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isEmpty}
                        className={`btn btn-primary w-full justify-center ${isEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Beküldés
                    </button>
                </div>

                <div className="mt-8 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs text-secondary m-0">
                        © 2025 BO-ZSO Hungary Kft.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RemoteSign;
