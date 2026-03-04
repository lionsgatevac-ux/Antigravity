import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Type, Eraser, Trash2, Download, Square, Circle, Pen, Save, Undo, Ruler } from 'lucide-react';
import { uploadsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import './FloorPlanner.css';

export default function FloorPlanner({ projectId, onSaveSuccess }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const { showToast } = useApp();

    // State - Unified elements array for correct Z-index
    const [elements, setElements] = useState([]);
    const [history, setHistory] = useState([]); // For Redo if needed, or just to store future states

    // Current interaction
    const [tool, setTool] = useState('line');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState(null);
    const [currentElement, setCurrentElement] = useState(null);

    // Text input state
    const [currentText, setCurrentText] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initial load handler to set canvas size
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                canvasRef.current.width = containerWidth;

                const viewportHeight = window.innerHeight;
                const rect = containerRef.current.getBoundingClientRect();
                const topOffset = rect.top;

                // Calculate height to fit screen, leaving space for bottom buttons (approx 80px)
                let calculatedHeight = viewportHeight - topOffset - 100;

                // Adjust for mobile if sidebar is below or buttons are more cramped
                if (window.innerWidth < 768) {
                    calculatedHeight = viewportHeight - topOffset - 150;
                }

                // Set a reasonable minimum and maximum
                if (calculatedHeight < 300) calculatedHeight = 300;
                if (calculatedHeight > 800) calculatedHeight = 800; // Limit for huge screens to keep it usable

                canvasRef.current.height = calculatedHeight;
                drawCanvas();
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Re-draw whenever elements or current interaction changes
    useEffect(() => {
        drawCanvas();
    }, [elements, currentElement]);

    const drawGrid = (ctx, canvas) => {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        const gridSize = 20;

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
        ctx.strokeStyle = style?.stroke || '#000000';
        ctx.fillStyle = style?.fill || '#000000';

        if (type === 'line' || type === 'dimension') {
            ctx.beginPath();
            ctx.moveTo(element.x1, element.y1);
            ctx.lineTo(element.x2, element.y2);
            ctx.stroke();

            // Add diagonal slashes for dimension line
            if (type === 'dimension') {
                const slashSize = 10;
                // Architectural slashes are usually 45 or 135 degrees relative to horizontal
                // Based on user image, they are slanted like / (approx 135 or -45 deg)
                const fixedAngle = Math.PI * 0.75; // 135 degrees

                // Start point slash
                ctx.beginPath();
                ctx.moveTo(element.x1 - Math.cos(fixedAngle) * slashSize, element.y1 - Math.sin(fixedAngle) * slashSize);
                ctx.lineTo(element.x1 + Math.cos(fixedAngle) * slashSize, element.y1 + Math.sin(fixedAngle) * slashSize);
                ctx.stroke();

                // End point slash
                ctx.beginPath();
                ctx.moveTo(element.x2 - Math.cos(fixedAngle) * slashSize, element.y2 - Math.sin(fixedAngle) * slashSize);
                ctx.lineTo(element.x2 + Math.cos(fixedAngle) * slashSize, element.y2 + Math.sin(fixedAngle) * slashSize);
                ctx.stroke();
            }
        }
        else if (type === 'rectangle') {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
        }
        else if (type === 'circle') {
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        else if (type === 'freehand' || type === 'eraser') {
            if (element.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
                ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            ctx.stroke();
        }
        else if (type === 'text') {
            ctx.font = '14px Arial';
            ctx.fillText(element.content, element.x, element.y);
        }
    };

    const drawCanvas = (exportMode = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Clear canvas
        if (exportMode) {
            // For export: solid white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // For editor: clear to transparent (or whatever CSS bg is) and draw grid
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid(ctx, canvas);
        }

        // Draw saved elements
        elements.forEach(el => drawElement(ctx, el));

        // Draw current interaction preview (only if NOT exporting)
        if (currentElement && !exportMode) {
            // Preview style
            const previewStyle = { ...currentElement.style };
            // Optional: dashed line for shapes being drawn
            if (['line', 'rectangle', 'circle'].includes(currentElement.type)) {
                ctx.setLineDash([5, 5]);
            }

            drawElement(ctx, { ...currentElement, style: previewStyle });

            ctx.setLineDash([]);
        }
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        const pos = getMousePos(e);

        if (tool === 'text') {
            setTextPosition(pos);
            setShowTextInput(true);
            return;
        }

        setIsDrawing(true);
        setStartPos(pos);

        // Initialize current element based on tool
        if (tool === 'freehand') {
            setCurrentElement({
                type: 'freehand',
                points: [pos],
                style: { stroke: '#000000', lineWidth: 2 }
            });
        } else if (tool === 'eraser') {
            setCurrentElement({
                type: 'eraser', // Treated as freehand in draw
                points: [pos],
                style: { stroke: '#ffffff', lineWidth: 20 } // White, thick brush
            });
        } else if (tool === 'line' || tool === 'dimension') {
            setCurrentElement({
                type: tool,
                x1: pos.x, y1: pos.y,
                x2: pos.x, y2: pos.y,
                style: { stroke: '#000000', lineWidth: 2 }
            });
        } else if (tool === 'rectangle') {
            setCurrentElement({
                type: 'rectangle',
                x: pos.x, y: pos.y,
                width: 0, height: 0,
                style: { stroke: '#000000', lineWidth: 2 }
            });
        } else if (tool === 'circle') {
            setCurrentElement({
                type: 'circle',
                x: pos.x, y: pos.y,
                radius: 0,
                style: { stroke: '#000000', lineWidth: 2 }
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !currentElement) return;

        e.preventDefault();
        const pos = getMousePos(e);

        if (tool === 'freehand' || tool === 'eraser') {
            setCurrentElement(prev => ({
                ...prev,
                points: [...prev.points, pos]
            }));
        } else if (tool === 'line' || tool === 'dimension') {
            setCurrentElement(prev => ({
                ...prev,
                x2: pos.x,
                y2: pos.y
            }));
        } else if (tool === 'rectangle') {
            const width = pos.x - startPos.x;
            const height = pos.y - startPos.y;
            setCurrentElement(prev => ({
                ...prev,
                x: width < 0 ? pos.x : startPos.x,
                y: height < 0 ? pos.y : startPos.y,
                width: Math.abs(width),
                height: Math.abs(height)
            }));
        } else if (tool === 'circle') {
            const radius = Math.hypot(pos.x - startPos.x, pos.y - startPos.y);
            setCurrentElement(prev => ({
                ...prev,
                radius: radius
            }));
        }
    };

    const handleMouseUp = (e) => {
        if (!isDrawing) return;

        if (currentElement) {
            setElements([...elements, currentElement]);
        }

        setIsDrawing(false);
        setStartPos(null);
        setCurrentElement(null);
    };

    const addText = () => {
        if (currentText && textPosition) {
            setElements([...elements, {
                type: 'text',
                content: currentText,
                x: textPosition.x,
                y: textPosition.y,
                style: { fill: '#000000' }
            }]);
            setCurrentText('');
            setShowTextInput(false);
            setTextPosition(null);
        }
    };

    const clearAll = () => {
        if (confirm('Biztosan törölni szeretnéd az összes rajzot?')) {
            setElements([]);
        }
    };

    const handleUndo = () => {
        if (elements.length > 0) {
            setElements(elements.slice(0, -1));
        }
    };

    const downloadImage = () => {
        // Redraw without grid specifically for export
        drawCanvas(true);

        const canvas = canvasRef.current;
        const url = canvas.toDataURL('image/png');

        // Restore grid immediately
        drawCanvas(false);

        const link = document.createElement('a');
        link.download = `alaprajz_${Date.now()}.png`;
        link.href = url;
        link.click();
    };

    const saveToProject = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            // Redraw without grid specifically for export
            drawCanvas(true);
            const canvas = canvasRef.current;

            canvas.toBlob(async (blob) => {
                // Restore grid immediately after blob creation
                drawCanvas(false);

                if (!blob) {
                    showToast('Hiba a kép generálásakor', 'error');
                    setIsSaving(false);
                    return;
                }

                const formData = new FormData();
                formData.append('projectId', projectId);
                formData.append('photoType', 'floor_plan');
                formData.append('photo', blob, `floor_plan_${Date.now()}.png`);

                try {
                    await uploadsAPI.uploadPhoto(formData);
                    showToast('Alaprajz sikeresen mentve a projektbe!', 'success');
                    if (onSaveSuccess) onSaveSuccess();
                } catch (error) {
                    console.error('Error uploading floor plan:', error);
                    showToast('Hiba a mentés során', 'error');
                } finally {
                    setIsSaving(false);
                }
            }, 'image/png');
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Váratlan hiba történt', 'error');
        }
    };

    return (
        <div className="floor-planner-container">
            <h1 className="floor-planner-header text-2xl font-bold">
                Alaprajz Tervező
            </h1>

            <div className="floor-planner-workspace">
                {/* Sidebar Toolbar */}
                <div className="floor-planner-sidebar">
                    <div className="floor-planner-toolbar">
                        <button
                            onClick={() => setTool('line')}
                            className={`floor-planner-btn ${tool === 'line' ? 'active' : ''}`}
                            title="Egyenes vonal"
                        >
                            <Pencil size={18} />
                            Vonal
                        </button>

                        <button
                            onClick={() => setTool('dimension')}
                            className={`floor-planner-btn ${tool === 'dimension' ? 'active' : ''}`}
                            title="Méretvonal (Építészeti)"
                        >
                            <Ruler size={18} />
                            Méret
                        </button>

                        <button
                            onClick={() => setTool('freehand')}
                            className={`floor-planner-btn ${tool === 'freehand' ? 'active' : ''}`}
                            title="Szabadkézi rajz"
                        >
                            <Pen size={18} />
                            Kézi
                        </button>

                        <button
                            onClick={() => setTool('rectangle')}
                            className={`floor-planner-btn ${tool === 'rectangle' ? 'active' : ''}`}
                            title="Négyszög"
                        >
                            <Square size={18} />
                            Négyszög
                        </button>

                        <button
                            onClick={() => setTool('circle')}
                            className={`floor-planner-btn ${tool === 'circle' ? 'active' : ''}`}
                            title="Kör"
                        >
                            <Circle size={18} />
                            Kör
                        </button>

                        <button
                            onClick={() => setTool('text')}
                            className={`floor-planner-btn ${tool === 'text' ? 'active' : ''}`}
                            title="Szöveg hozzáadása"
                        >
                            <Type size={18} />
                            T/M
                        </button>

                        <button
                            onClick={() => setTool('eraser')}
                            className={`floor-planner-btn ${tool === 'eraser' ? 'active' : ''}`}
                            title="Radír (Fehér ecset)"
                        >
                            <Eraser size={18} />
                            Radír
                        </button>

                        <button
                            onClick={handleUndo}
                            className="floor-planner-btn"
                            title="Visszavonás"
                        >
                            <Undo size={18} />
                            Utolsó
                        </button>

                        <button
                            onClick={clearAll}
                            className="floor-planner-btn btn-delete"
                            title="Mindent töröl"
                        >
                            <Trash2 size={18} />
                            Törlés
                        </button>
                    </div>
                </div>

                {/* Main Drawing Area */}
                <div className="floor-planner-canvas-area">
                    {/* Instructions */}
                    <div className="floor-planner-instructions">
                        <strong>Használat:</strong>{' '}
                        {tool === 'line' && 'Kattints és húzd az egyeneshez.'}
                        {tool === 'dimension' && 'Kattints és húzd a méretvonalhoz.'}
                        {tool === 'freehand' && 'Rajzolj szabadkézzel.'}
                        {tool === 'rectangle' && 'Húzd az átlót a négyszöghöz.'}
                        {tool === 'circle' && 'Húzd a sugarat a körhöz.'}
                        {tool === 'text' && 'Kattints a helyre ahova írni szeretnél.'}
                        {tool === 'eraser' && 'Fehér festékkel felülírja a rajzot (hibajavító).'}
                    </div>

                    {/* Canvas */}
                    <div className="floor-planner-canvas-container" ref={containerRef}>
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onTouchStart={handleMouseDown}
                            onTouchEnd={handleMouseUp}
                            onTouchMove={handleMouseMove}
                            className="floor-planner-canvas"
                        />
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex gap-md justify-between items-center mt-md" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <button
                            onClick={downloadImage}
                            className="floor-planner-btn btn-download"
                            style={{ width: 'auto' }}
                        >
                            <Download size={18} />
                            Letöltés
                        </button>

                        <button
                            onClick={saveToProject}
                            disabled={isSaving}
                            className="floor-planner-btn btn-save"
                            style={{ marginLeft: 'auto', width: 'auto' }}
                        >
                            {isSaving ? (
                                <div className="floor-planner-loader">Mentés...</div>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Mentés a Projektbe
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>


            {/* Text Input Modal */}
            {showTextInput && (
                <div className="floor-planner-modal-overlay">
                    <div className="floor-planner-modal">
                        <h3>Szöveg hozzáadása</h3>
                        <input
                            type="text"
                            value={currentText}
                            onChange={(e) => setCurrentText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addText()}
                            placeholder="Írd be a méretet (pl. 3.5m)"
                            className="floor-planner-input"
                            autoFocus
                        />
                        <div className="floor-planner-modal-actions">
                            <button
                                onClick={addText}
                                className="floor-planner-modal-btn primary"
                            >
                                Hozzáadás
                            </button>
                            <button
                                onClick={() => {
                                    setShowTextInput(false);
                                    setCurrentText('');
                                    setTextPosition(null);
                                }}
                                className="floor-planner-modal-btn secondary"
                            >
                                Mégse
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
