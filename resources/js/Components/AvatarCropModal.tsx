import { useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { getCroppedImg } from '@/Utils/cropImage';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from 'lucide-react';

interface AvatarCropModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
}

export default function AvatarCropModal({
    isOpen,
    imageSrc,
    onClose,
    onCropComplete,
}: AvatarCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (newCrop: Point) => {
        setCrop(newCrop);
    };

    const onZoomChange = (newZoom: number) => {
        setZoom(newZoom);
    };

    const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setIsProcessing(true);
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, 'avatar.jpg');
            const previewUrl = URL.createObjectURL(croppedFile);
            onCropComplete(croppedFile, previewUrl);
            onClose();
        } catch (error) {
            console.error('Failed to crop image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* ── Modal Header ── */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#06283A]">
                            Sesuaikan Foto Profil
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Geser dan perbesar foto agar pas di dalam lingkaran avatar.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Tutup"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Cropper Canvas Area ── */}
                <div className="relative w-full h-72 sm:h-80 bg-slate-950 select-none overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={handleCropComplete}
                    />
                </div>

                {/* ── Zoom Slider & Controls ── */}
                <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                            <ZoomIn size={14} className="text-slate-500" />
                            <span>Zoom & Skala</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
                                title="Reset posisi & zoom"
                            >
                                <RotateCcw size={11} />
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Zoom out"
                        >
                            <ZoomOut size={15} />
                        </button>

                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#06283A]"
                            aria-label="Zoom slider"
                        />

                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Zoom in"
                        >
                            <ZoomIn size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Modal Footer ── */}
                <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-[#06283A] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        style={{ backgroundColor: '#F6C343' }}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <Check size={14} strokeWidth={2.5} />
                                <span>Terapkan Foto</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
