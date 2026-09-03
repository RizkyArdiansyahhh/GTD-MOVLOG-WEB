import { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    AlertCircle,
    Upload,
    MapPin,
    Calendar,
    Check,
    Clock,
    FileText,
    Image as ImageIcon,
    Trash2,
    Crosshair,
    RefreshCw,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import type { SessionStage, MovementItem, TemplateFieldOption, TemplatePhotoSlot } from '../types';

interface MovementReportModalProps {
    sessionId: string;
    stage: SessionStage;
    movement: MovementItem;
    isOpen: boolean;
    onClose: () => void;
}

export default function MovementReportModal({
    sessionId,
    stage,
    movement,
    isOpen,
    onClose,
}: MovementReportModalProps) {
    if (!isOpen) return null;

    const snapshot = stage.template_snapshot;
    const report = movement.report;

    // Field values state
    const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});

    // Selected files per photo slot
    const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

    // GPS & Event time
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'denied' | 'error'>('idle');
    const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

    const [eventAt, setEventAt] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Synchronize and completely reset state whenever movement or report changes
    useEffect(() => {
        const initialFields: Record<string, string | number> = {};
        if (movement.report?.values) {
            Object.entries(movement.report.values).forEach(([k, v]) => {
                if (v !== null && v !== undefined) {
                    initialFields[k] = v as string | number;
                }
            });
        }
        setFieldValues(initialFields);
        setPhotoFiles({});
        setPreviewUrls({});
        setErrorMessage(null);

        if (movement.report?.latitude && movement.report?.longitude) {
            setLatitude(String(movement.report.latitude));
            setLongitude(String(movement.report.longitude));
            setGpsStatus('success');
        } else {
            // Auto trigger high accuracy GPS if coordinates not yet stored
            fetchBrowserGps();
        }

        if (movement.report?.event_at) {
            setEventAt(movement.report.event_at.replace(' ', 'T').slice(0, 16));
        } else {
            const now = new Date();
            const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setEventAt(localIso);
        }
    }, [movement.id, movement.report]);

    // Real Browser Geolocation Trigger
    const fetchBrowserGps = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            setGpsErrorMsg('Browser tidak mendukung Geolocation API.');
            return;
        }

        setGpsStatus('fetching');
        setGpsErrorMsg(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                setLatitude(lat);
                setLongitude(lng);
                setGpsStatus('success');
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setGpsStatus('denied');
                    setGpsErrorMsg('Izin akses lokasi GPS ditolak oleh pengguna/browser.');
                } else {
                    setGpsStatus('error');
                    setGpsErrorMsg('Gagal memperoleh sinyal GPS akurat.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleFileChange = (fieldKey: string, file: File | null) => {
        if (!file) {
            const newFiles = { ...photoFiles };
            delete newFiles[fieldKey];
            setPhotoFiles(newFiles);

            const newPreviews = { ...previewUrls };
            delete newPreviews[fieldKey];
            setPreviewUrls(newPreviews);
            return;
        }

        setPhotoFiles((prev) => ({ ...prev, [fieldKey]: file }));
        setPreviewUrls((prev) => ({ ...prev, [fieldKey]: URL.createObjectURL(file) }));
    };

    const handleSetCurrentTime = () => {
        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setEventAt(localIso);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        const formData = new FormData();
        Object.entries(fieldValues).forEach(([k, v]) => {
            formData.append(`fields[${k}]`, String(v));
        });

        Object.entries(photoFiles).forEach(([k, file]) => {
            formData.append(`photos[${k}]`, file);
        });

        if (latitude) formData.append('latitude', latitude);
        if (longitude) formData.append('longitude', longitude);
        if (eventAt) formData.append('event_at', eventAt);

        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/movements/${movement.id}/reports`,
            formData as any,
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setErrorMessage(errors.report || 'Gagal menyimpan laporan armada.');
                },
                preserveScroll: true,
            }
        );
    };

    const handleComplete = () => {
        setErrorMessage(null);
        setIsCompleting(true);

        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/movements/${movement.id}/complete-report`,
            {},
            {
                onSuccess: () => {
                    setIsCompleting(false);
                    onClose();
                },
                onError: (errors) => {
                    setIsCompleting(false);
                    setErrorMessage(errors.report || 'Gagal menyelesaikan laporan armada. Pastikan seluruh field & foto wajib telah terpenuhi.');
                },
                preserveScroll: true,
            }
        );
    };

    const fields = snapshot?.fields || [];
    const photoSlots = snapshot?.photo_slots || [];

    // Helper map of existing photos by field_key
    const existingPhotosByKey = new Map<string, string>();
    if (report?.photos) {
        report.photos.forEach((p) => {
            if (p.field_key) {
                existingPhotosByKey.set(p.field_key, p.photo_url);
            }
        });
    }

    // Calculate completion checklist
    const completedFieldsCount = fields.filter((f) => {
        const val = fieldValues[f.field_key];
        return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;

    const completedPhotosCount = photoSlots.filter((ps) => {
        return existingPhotosByKey.has(ps.field_key) || photoFiles[ps.field_key] !== undefined;
    }).length;

    const totalRequirements = fields.filter((f) => f.required).length + photoSlots.filter((ps) => ps.required).length;
    const satisfiedRequirements =
        fields.filter((f) => f.required && fieldValues[f.field_key] !== undefined && String(fieldValues[f.field_key]).trim() !== '').length +
        photoSlots.filter((ps) => ps.required && (existingPhotosByKey.has(ps.field_key) || photoFiles[ps.field_key] !== undefined)).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F5B800]">
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[#06283A]">
                                    Laporan Aktivitas: {movement.movement_name}
                                </h3>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                        movement.is_completed
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : report
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    {movement.is_completed
                                        ? 'SELESAI'
                                        : report
                                        ? 'DALAM PROSES'
                                        : 'BELUM DIMULAI'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                {stage.stage_name} (Tahap {stage.stage_order}) &middot; Snapshot Template: {snapshot?.template_name || 'Server-Driven'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Progress Requirement Bar ── */}
                <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
                        Kelengkapan Syarat Snapshot:
                        <span className="font-bold text-[#06283A]">
                            {satisfiedRequirements} / {totalRequirements} Syarat Terpenuhi
                        </span>
                    </div>
                    <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                satisfiedRequirements === totalRequirements ? 'bg-emerald-500' : 'bg-[#F5B800]'
                            }`}
                            style={{
                                width: `${totalRequirements > 0 ? (satisfiedRequirements / totalRequirements) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="p-6 space-y-6 overflow-y-auto grow">
                    {errorMessage && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                            <div>
                                <p className="font-bold">Gagal Menyimpan / Menyelesaikan</p>
                                <p>{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Section 1: Dynamic Form Fields */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#06283A]" />
                            Form Isian Data ({completedFieldsCount}/{fields.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((field: TemplateFieldOption) => {
                                const val = fieldValues[field.field_key] ?? '';
                                return (
                                    <div key={field.field_key} className="space-y-1">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            {field.label}{' '}
                                            {field.required && <span className="text-rose-500">*</span>}
                                        </label>

                                        {field.options && field.options.length > 0 ? (
                                            <select
                                                value={val}
                                                onChange={(e) =>
                                                    setFieldValues((prev) => ({
                                                        ...prev,
                                                        [field.field_key]: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F5B800]/20 focus:border-[#F5B800] transition-all"
                                            >
                                                <option value="">-- Pilih {field.label} --</option>
                                                {field.options.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.field_type === 'number' ? 'number' : 'text'}
                                                value={val}
                                                placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                                                onChange={(e) =>
                                                    setFieldValues((prev) => ({
                                                        ...prev,
                                                        [field.field_key]: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F5B800]/20 focus:border-[#F5B800] transition-all"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Required Photo Slots */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#06283A]" />
                            Slot Foto Dokumentasi Bukti ({completedPhotosCount}/{photoSlots.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {photoSlots.map((slot: TemplatePhotoSlot) => {
                                const existingUrl = existingPhotosByKey.get(slot.field_key);
                                const previewUrl = previewUrls[slot.field_key];
                                const hasPhoto = Boolean(previewUrl || existingUrl);

                                return (
                                    <div
                                        key={slot.field_key}
                                        className={`p-3.5 rounded-xl border transition-all ${
                                            hasPhoto
                                                ? 'bg-emerald-50/40 border-emerald-200'
                                                : slot.required
                                                ? 'bg-amber-50/30 border-amber-200/80'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                {hasPhoto ? (
                                                    <CheckCircle2 size={15} className="text-emerald-600" />
                                                ) : (
                                                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400 font-bold" />
                                                )}
                                                <span className="text-xs font-bold text-[#06283A]">
                                                    {slot.label}
                                                </span>
                                            </div>
                                            {slot.required && (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                                    Wajib
                                                </span>
                                            )}
                                        </div>

                                        {/* Photo Preview / Upload area */}
                                        {hasPhoto ? (
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={previewUrl || existingUrl}
                                                        alt={slot.label}
                                                        className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                                                    />
                                                    <div className="text-[11px] text-slate-600 space-y-0.5">
                                                        <p className="font-semibold text-emerald-800">
                                                            {previewUrl ? 'Foto Baru Dipilih' : 'Tersimpan di Server'}
                                                        </p>
                                                        <label className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium block">
                                                            Ganti Foto
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) =>
                                                                    handleFileChange(
                                                                        slot.field_key,
                                                                        e.target.files?.[0] || null
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                </div>

                                                {previewUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFileChange(slot.field_key, null)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Batalkan pilihan foto"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center py-3 border border-dashed border-slate-300 hover:border-[#F5B800] rounded-lg cursor-pointer bg-white hover:bg-amber-50/20 transition-all">
                                                <Upload size={16} className="text-slate-400 mb-1" />
                                                <span className="text-[11px] font-medium text-slate-600">
                                                    Klik untuk upload foto
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) =>
                                                        handleFileChange(
                                                            slot.field_key,
                                                            e.target.files?.[0] || null
                                                        )
                                                    }
                                                />
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Geotagging GPS & Timestamp */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#06283A]" />
                                Metadata Geotagging & Waktu
                            </h4>
                            <button
                                type="button"
                                onClick={fetchBrowserGps}
                                disabled={gpsStatus === 'fetching'}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Crosshair size={12} className={gpsStatus === 'fetching' ? 'animate-spin' : ''} />
                                {gpsStatus === 'fetching' ? 'Mencari GPS...' : 'Ambil GPS Terkini'}
                            </button>
                        </div>

                        {gpsErrorMsg && (
                            <div className="p-2.5 mb-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{gpsErrorMsg} Anda dapat mengisi koordinat secara manual.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Latitude (GPS) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="-1.265386"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F5B800]/20 focus:border-[#F5B800]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Longitude (GPS) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="116.831200"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F5B800]/20 focus:border-[#F5B800]"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[11px] font-semibold text-slate-700">
                                        Waktu Kejadian <span className="text-rose-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleSetCurrentTime}
                                        className="text-[10px] text-blue-600 hover:underline font-medium"
                                    >
                                        Waktu Sekarang
                                    </button>
                                </div>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="datetime-local"
                                        value={eventAt}
                                        onChange={(e) => setEventAt(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F5B800]/20 focus:border-[#F5B800]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer Actions ── */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Tutup
                    </button>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSubmitting || isCompleting}
                            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Data & Foto'}
                        </button>

                        {!movement.is_completed && (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={isSubmitting || isCompleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                            >
                                <Check size={14} />
                                {isCompleting ? 'Menyelesaikan...' : 'Selesaikan Laporan'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
