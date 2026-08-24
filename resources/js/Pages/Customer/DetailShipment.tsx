import { Head, Link, useForm } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { CheckpointDetail, DocumentSummary, ActivePIC, ShipmentSummary } from '@/types/customer';
import { useState } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileCheck2,
    Download,
    Lock,
    MapPin,
    Phone,
    Mail,
    Send,
    MessageSquare,
    Truck,
} from 'lucide-react';

interface DetailShipmentProps {
    shipment: ShipmentSummary;
    checkpoints: CheckpointDetail[];
    documents: DocumentSummary;
    active_pic: ActivePIC | null;
}

export default function DetailShipment({
    shipment,
    checkpoints,
    documents,
    active_pic,
}: DetailShipmentProps) {
    const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        shipping_session_id: shipment.id,
        pic_user_id: active_pic?.id ?? null,
        subject: `Pertanyaan Pengiriman #${shipment.assignment_no}`,
        message: '',
    });

    const submitInquiry = (e: React.FormEvent) => {
        e.preventDefault();
        post('/customer/inquiries', {
            onSuccess: () => {
                setInquiryModalOpen(false);
                reset('message');
            },
        });
    };

    return (
        <CustomerLayout title={`Detail #${shipment.assignment_no}`}>
            <Head title={`Tracking #${shipment.assignment_no}`} />

            {/* Back Button & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/customer/monitoring-barang"
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                #{shipment.assignment_no}
                            </span>
                            <span className="text-xs font-bold text-slate-500">• {shipment.cargo_name}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                            {shipment.origin} ➔ {shipment.destination}
                        </h1>
                    </div>
                </div>

                {/* Hubungi PIC button */}
                {active_pic && (
                    <button
                        onClick={() => setInquiryModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                    >
                        <MessageSquare size={15} className="text-amber-400" />
                        <span>Hubungi PIC ({active_pic.name})</span>
                    </button>
                )}
            </div>

            {/* Shipment Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        TOTAL MUATAN
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-1">
                        {shipment.total_quantity.toLocaleString('id-ID')} {shipment.unit}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        POSISI CHECKPOINT
                    </span>
                    <p className="text-sm font-black text-amber-600 truncate mt-1">
                        {shipment.current_checkpoint}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        STATUS OPERASIONAL
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-1">
                        {shipment.status_label}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        PROGRES TAHAPAN
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-1">
                        {shipment.progress_percentage}%
                    </p>
                </div>
            </div>

            {/* Main Content Grid: Checkpoints Stepper (Left) & Document Center (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Checkpoint Stepper Timeline (7 Cols) */}
                <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900">Timeline Tahapan Checkpoint</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Urutan alur pelayaran dari jetty muat hingga site bongkar.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            {checkpoints.filter(c => c.status === 'completed').length} / {checkpoints.length} Selesai
                        </span>
                    </div>

                    <div className="space-y-6 relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-200">
                        {checkpoints.map((cp, idx) => {
                            const isCompleted = cp.status === 'completed';
                            const isInProgress = cp.status === 'in_progress';
                            return (
                                <div key={cp.id} className="relative">
                                    {/* Stepper Dot */}
                                    <div className="absolute -left-[30px] top-0.5">
                                        {isCompleted ? (
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                <CheckCircle2 size={13} strokeWidth={3} />
                                            </div>
                                        ) : isInProgress ? (
                                            <div className="w-5 h-5 rounded-full bg-amber-400 ring-4 ring-amber-100 flex items-center justify-center">
                                                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-slate-300" />
                                        )}
                                    </div>

                                    {/* Checkpoint Info Box */}
                                    <div className={`p-4 rounded-xl border transition-all ${
                                        isInProgress
                                            ? 'bg-amber-50/50 border-amber-200/90 shadow-xs'
                                            : isCompleted
                                            ? 'bg-slate-50/60 border-slate-200/80'
                                            : 'bg-white border-slate-100 opacity-60'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-extrabold text-slate-400">
                                                    TAHAP #{cp.sequence}
                                                </span>
                                                <h3 className="font-extrabold text-slate-900 text-sm">
                                                    {cp.checkpoint_name}
                                                </h3>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                                isCompleted
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : isInProgress
                                                    ? 'bg-amber-200 text-amber-900 font-black'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {cp.status_label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-200/60">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-semibold">PIC CHECKPOINT:</span>
                                                <span className="font-bold text-slate-800">{cp.pic_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-semibold">TANGGAL AKTUAL:</span>
                                                <span className="font-bold text-slate-800">{cp.actual_arrival ?? '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Document Center (5 Cols) */}
                <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <FileCheck2 size={18} className="text-amber-500" />
                            <h2 className="text-base font-extrabold text-slate-900">Document Center</h2>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                            {documents.verified_count} Diverifikasi
                        </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                        Hanya berkas resmi yang telah diverifikasi final oleh tim operasional GTD yang dapat diunduh.
                    </p>

                    <div className="space-y-3 flex-1">
                        {documents.verified_documents.length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                                <Lock size={20} className="mx-auto mb-2 opacity-40 text-slate-400" />
                                Belum ada dokumen final yang terverifikasi untuk sesi pengiriman ini.
                            </div>
                        ) : (
                            documents.verified_documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                                            PDF
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {doc.file_name}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {doc.document_type} • {doc.verified_at}
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href={doc.download_url}
                                        className="p-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                                        title="Unduh Berkas"
                                    >
                                        <Download size={14} />
                                    </a>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Inquiry Modal */}
            {inquiryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h3 className="font-extrabold text-slate-900 text-base">
                                Hubungi PIC Operasional GTD
                            </h3>
                            <button
                                onClick={() => setInquiryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitInquiry} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Subjek Pesan
                                </label>
                                <input
                                    type="text"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pesan / Pertanyaan
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Tuliskan pertanyaan operasional atau koordinasi kargo Anda..."
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-slate-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setInquiryModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black"
                                >
                                    {processing ? 'Mengirim...' : 'Kirim Pesan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CustomerLayout>
    );
}
