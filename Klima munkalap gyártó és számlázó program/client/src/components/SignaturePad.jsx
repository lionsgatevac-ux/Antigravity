import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Save } from 'lucide-react';

export default function SignaturePad({ onSave, onCancel }) {
    const sigCanvas = useRef({});
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (isEmpty) return;
        // getTrimmedCanvas cause issues with Vite in some cases, reverting to direct dataURL
        const dataURL = sigCanvas.current.toDataURL('image/png');
        onSave(dataURL);
    };

    const handleEnd = () => {
        setIsEmpty(sigCanvas.current.isEmpty());
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            <div className="border border-gray-300 rounded-lg overflow-hidden relative bg-white shadow-inner h-64 md:h-80">
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: 'w-full h-full cursor-crosshair touch-none' // Prevents scrolling on touch devices
                    }}
                    onBegin={() => setIsEmpty(false)}
                    onEnd={handleEnd}
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 text-xl font-bold uppercase select-none">
                        Itt írja alá
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clear} type="button">
                    <Eraser size={16} className="mr-2" />
                    Törlés
                </Button>
                <Button variant="outline" onClick={onCancel} type="button">
                    Mégse
                </Button>
                <Button onClick={save} disabled={isEmpty} type="button">
                    <Save size={16} className="mr-2" />
                    Mentés
                </Button>
            </div>
        </div>
    );
}
