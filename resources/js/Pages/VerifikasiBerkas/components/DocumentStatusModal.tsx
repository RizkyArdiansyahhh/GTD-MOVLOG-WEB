import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { VerificationDocument, VerificationStatus } from '../types';

interface DocumentStatusModalProps {
    isOpen: boolean;
    document: VerificationDocument | null;
    targetStatus: VerificationStatus | null;
    onClose: () => void;
    onConfirm: (document: VerificationDocument, status: VerificationStatus, notes: string) => void;
    isSubmitting?: boolean;
}

export default function DocumentStatusModal({
    isOpen,
    document,
    targetStatus,
    onClose,
    onConfirm,
    isSubmitting = false,
}: DocumentStatusModalProps) {
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (document) {
            setNotes(document.rejectionReason || document.notes || '');
            setError('');
        }
    }, [document, targetStatus]);

    if (!isOpen || !document || !targetStatus) return null;

    const isApproval = targetStatus === 'Approved';

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isApproval && !notes.trim()) {
            setError('Alasan penolakan wajib diisi.');
            return;
        }
        setError('');
        onConfirm(document, targetStatus, notes.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
            <div
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header Icon & Title */}
                <div className="flex items-center gap-3">
                    <div
                        className={[
                            'flex items-center justify-center rounded-xl shrink-0',
                            isApproval ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600',
                        ].join(' ')}
                        style={{ width: 44, height: 44 }}
                    >
                        {isApproval ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                            {isApproval ? 'Konfirmasi Persetujuan Berkas' : 'Konfirmasi Penolakan Berkas'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">
                            {document.documentNumber} • {document.documentType}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">
                    Apakah Anda yakin ingin {isApproval ? 'menyetujui' : 'menolak'} berkas{' '}
                    <strong className="text-gray-900">{document.title}</strong> dari{' '}
                    <strong className="text-gray-900">{document.uploadedBy}</strong>?
                </p>

                {/* Notes Input Form */}
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Catatan Verifikasi {isApproval ? '(Opsional)' : '(Wajib)'}
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder={
                                isApproval
                                    ? 'Tambahkan catatan persetujuan jika ada...'
                                    : 'Berikan alasan jelas penolakan dokumen (Wajib)...'
                            }
                            required={!isApproval}
                            className={[
                                'w-full rounded-lg border text-xs p-2.5 outline-none transition-all placeholder:text-gray-400',
                                error
                                    ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                                    : 'border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200',
                            ].join(' ')}
                        />
                        {error && (
                            <p className="text-[11px] font-semibold text-rose-600 mt-1">
                                {error}
                            </p>
                        )}
                    </div>

                    {!isApproval && (
                        <div className="flex items-start gap-2 p-2.5 bg-rose-50 rounded-lg text-[11px] text-rose-700">
                            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                            <span>
                                Penolakan berkas akan memberitahukan pihak pengunggah untuk memperbarui dokumen.
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!isApproval && !notes.trim())}
                            className={[
                                'px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50',
                                isApproval
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700',
                            ].join(' ')}
                        >
                            {isSubmitting
                                ? 'Memproses...'
                                : isApproval
                                ? 'Ya, Setujui Berkas'
                                : 'Ya, Tolak Berkas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
