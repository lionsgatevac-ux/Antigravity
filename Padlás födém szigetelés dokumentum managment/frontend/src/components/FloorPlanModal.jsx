import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Type, Eraser, Trash2, Square, Circle, Pen, Save, Undo, Ruler, X, Maximize2 } from 'lucide-react';
import { uploadsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export default function FloorPlanModal({ projectId, isOpen, onClose, onSaveSuccess }) {
    const canvasRef = useRef(null);
    const startPosRef = useRef(null); // Use ref to avoid state update race conditions
    const { showToast } = useApp();

    const [elements, setElements] = useState([]);
    const [tool, setTool] = useState('line');
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentElement, setCurrentElement] = useState(null);
    const [currentText, setCurrentText] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Canvas size (778x518 + 10% = 856x570)
    const INTERNAL_WIDTH = 856;
    const INTERNAL_HEIGHT = 570;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                if (canvasRef.current) {
                    canvasRef.current.width = INTERNAL_WIDTH;
                    canvasRef.current.height = INTERNAL_HEIGHT;
                    drawCanvas();
                }
            }, 100);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) drawCanvas();
    }, [elements, currentElement, isOpen]);

    const drawGrid = (ctx, canvas) => {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        const gridSize = 40;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    };

    const drawElement = (ctx, element) => {
        const { type, style } = element;
        ctx.lineWidth = style?.lineWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = style?.stroke || '#1e3a5f';
        ctx.fillStyle = style?.fill || '#1e3a5f';

        if (type === 'line' || type === 'dimension') {
            ctx.beginPath();
            ctx.moveTo(element.x1, element.y1);
            ctx.lineTo(element.x2, element.y2);
            ctx.stroke();
            if (type === 'dimension') {
                const slashSize = 12;
                const fixedAngle = Math.PI * 0.75;
                ctx.beginPath();
                ctx.moveTo(element.x1 - Math.cos(fixedAngle) * slashSize, element.y1 - Math.sin(fixedAngle) * slashSize);
                ctx.lineTo(element.x1 + Math.cos(fixedAngle) * slashSize, element.y1 + Math.sin(fixedAngle) * slashSize);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(element.x2 - Math.cos(fixedAngle) * slashSize, element.y2 - Math.sin(fixedAngle) * slashSize);
                ctx.lineTo(element.x2 + Math.cos(fixedAngle) * slashSize, element.y2 + Math.sin(fixedAngle) * slashSize);
                ctx.stroke();
            }
        } else if (type === 'rectangle') {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
        } else if (type === 'circle') {
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (type === 'freehand' || type === 'eraser') {
            if (element.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
                ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            ctx.stroke();
        } else if (type === 'text') {
            ctx.font = 'bold 20px Inter, system-ui, sans-serif';
            ctx.fillText(element.content, element.x, element.y);
        }
    };

    const drawCanvas = (exportMode = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!exportMode) drawGrid(ctx, canvas);
        elements.forEach(el => drawElement(ctx, el));
        if (currentElement && !exportMode) {
            if (['line', 'rectangle', 'circle'].includes(currentElement.type)) {
                ctx.setLineDash([8, 4]);
            }
            drawElement(ctx, currentElement);
            ctx.setLineDash([]);
        }
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches?.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
        else if (e.changedTouches?.length > 0) { clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
        else { clientX = e.clientX; clientY = e.clientY; }
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        const pos = getMousePos(e);
        if (tool === 'text') { setTextPosition(pos); setShowTextInput(true); return; }

        // Store start position in ref for immediate access during fast moves
        startPosRef.current = pos;
        setIsDrawing(true);

        if (tool === 'freehand') setCurrentElement({ type: 'freehand', points: [pos], style: { stroke: '#1e3a5f', lineWidth: 2 } });
        else if (tool === 'eraser') setCurrentElement({ type: 'eraser', points: [pos], style: { stroke: '#ffffff', lineWidth: 30 } });
        else if (tool === 'line' || tool === 'dimension') setCurrentElement({ type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, style: { stroke: '#1e3a5f', lineWidth: 2 } });
        else if (tool === 'rectangle') setCurrentElement({ type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, style: { stroke: '#1e3a5f', lineWidth: 2 } });
        else if (tool === 'circle') setCurrentElement({ type: 'circle', x: pos.x, y: pos.y, radius: 0, style: { stroke: '#1e3a5f', lineWidth: 2 } });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !currentElement || !startPosRef.current) return;
        e.preventDefault();
        const pos = getMousePos(e);
        const start = startPosRef.current; // Use ref value directly

        if (tool === 'freehand' || tool === 'eraser') {
            setCurrentElement(prev => ({ ...prev, points: [...prev.points, pos] }));
        } else if (tool === 'line' || tool === 'dimension') {
            setCurrentElement(prev => ({ ...prev, x2: pos.x, y2: pos.y }));
        } else if (tool === 'rectangle') {
            const w = pos.x - start.x;
            const h = pos.y - start.y;
            setCurrentElement(prev => ({
                ...prev,
                x: w < 0 ? pos.x : start.x,
                y: h < 0 ? pos.y : start.y,
                width: Math.abs(w),
                height: Math.abs(h)
            }));
        } else if (tool === 'circle') {
            setCurrentElement(prev => ({ ...prev, radius: Math.hypot(pos.x - start.x, pos.y - start.y) }));
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        if (currentElement) setElements([...elements, currentElement]);
        setIsDrawing(false);
        startPosRef.current = null;
        setCurrentElement(null);
    };

    const addText = () => {
        if (currentText && textPosition) {
            setElements([...elements, { type: 'text', content: currentText, x: textPosition.x, y: textPosition.y, style: { fill: '#1e3a5f' } }]);
            setCurrentText(''); setShowTextInput(false); setTextPosition(null);
        }
    };

    const clearAll = () => { if (confirm('Biztosan törölni szeretnéd az összes rajzot?')) setElements([]); };
    const handleUndo = () => { if (elements.length > 0) setElements(elements.slice(0, -1)); };

    const saveToProject = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            drawCanvas(true);
            canvasRef.current.toBlob(async (blob) => {
                drawCanvas(false);
                if (!blob) { showToast('Hiba a kép generálásakor', 'error'); setIsSaving(false); return; }
                const formData = new FormData();
                formData.append('projectId', projectId);
                formData.append('photoType', 'floor_plan');
                formData.append('photo', blob, `floor_plan_${Date.now()}.png`);
                try {
                    await uploadsAPI.uploadPhoto(formData);
                    showToast('Alaprajz sikeresen mentve!', 'success');
                    if (onSaveSuccess) onSaveSuccess();
                    onClose();
                } catch (error) { console.error(error); showToast('Hiba a mentés során', 'error'); }
                finally { setIsSaving(false); }
            }, 'image/png');
        } catch (error) { console.error(error); setIsSaving(false); showToast('Váratlan hiba történt', 'error'); }
    };

    if (!isOpen) return null;

    const tools = [
        { id: 'line', icon: Pencil, label: 'Vonal' },
        { id: 'dimension', icon: Ruler, label: 'Méret' },
        { id: 'freehand', icon: Pen, label: 'Kézi' },
        { id: 'rectangle', icon: Square, label: 'Négyzet' },
        { id: 'circle', icon: Circle, label: 'Kör' },
        { id: 'text', icon: Type, label: 'Szöveg' },
        { id: 'eraser', icon: Eraser, label: 'Radír' },
    ];

    const portalRoot = document.getElementById('portal-root') || document.body;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)'
            }}
        >
            {/* Modal Container - Fixed Height */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: '1200px',
                height: 'calc(100vh - 40px)',
                maxHeight: '700px',
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}>

                {/* Header - Fixed Height */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
                    color: '#fff',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Maximize2 size={22} />
                        <span style={{ fontSize: '18px', fontWeight: 600 }}>Alaprajz Tervező</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: '#fff'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area - Flex Row */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Sidebar Tools */}
                    <div style={{
                        width: '70px',
                        background: '#f8fafc',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '12px 8px',
                        gap: '4px',
                        overflowY: 'auto',
                        flexShrink: 0
                    }}>
                        {tools.map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => setTool(id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px 4px',
                                    width: '54px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: tool === id ? '#3b82f6' : 'transparent',
                                    color: tool === id ? '#fff' : '#64748b',
                                    transition: 'all 0.15s'
                                }}
                                title={label}
                            >
                                <Icon size={20} />
                                <span style={{ fontSize: '9px', marginTop: '4px', fontWeight: 500 }}>{label}</span>
                            </button>
                        ))}

                        <div style={{ flex: 1 }} />

                        <button onClick={handleUndo} style={{
                            padding: '10px', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', background: 'transparent', color: '#64748b'
                        }} title="Visszavonás">
                            <Undo size={18} />
                        </button>
                        <button onClick={clearAll} style={{
                            padding: '10px', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', background: 'transparent', color: '#ef4444'
                        }} title="Törlés">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Canvas Area - Scrollable if needed */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        background: '#f1f5f9',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            maxHeight: '100%'
                        }}>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleMouseDown}
                                onTouchEnd={handleMouseUp}
                                onTouchMove={handleMouseMove}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '100%',
                                    cursor: 'crosshair',
                                    touchAction: 'none',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer - ALWAYS VISIBLE */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '12px 20px',
                    background: '#fff',
                    borderTop: '1px solid #e2e8f0',
                    gap: '12px',
                    flexShrink: 0
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 500
                        }}
                    >
                        Mégse
                    </button>
                    <button
                        onClick={saveToProject}
                        disabled={isSaving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            color: '#fff',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            opacity: isSaving ? 0.6 : 1
                        }}
                    >
                        {isSaving ? <span>⏳</span> : <Save size={18} />}
                        Mentés
                    </button>
                </div>
            </div>

            {/* Text Input Modal */}
            {showTextInput && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '24px',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '400px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                    }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Szöveg hozzáadása</h3>
                        <input
                            type="text"
                            value={currentText}
                            onChange={(e) => setCurrentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addText()}
                            placeholder="Pl. Nappali, 3.5m..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                marginBottom: '16px',
                                outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowTextInput(false)}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: '#f1f5f9'
                                }}
                            >
                                Mégse
                            </button>
                            <button
                                onClick={addText}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    fontWeight: 500
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>,
                portalRoot
            )}
        </div>,
        portalRoot
    );
}
