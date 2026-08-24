import { Head, Link, useForm } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { CustomerShipmentDetail } from '@/types/customer';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    FileCheck2,
    Download,
    CheckCircle2,
    Clock,
    Truck,
    Building2,
    Lock,
    MessageSquareQuote,
    Package,
} from 'lucide-react';
import { useState } from 'react';

interface DetailShipmentProps {
    shipment: CustomerShipmentDetail;
}

export default function DetailShipment({ shipment }: DetailShipmentProps) {
    const { header, checkpoints, documents } = shipment;
    const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        shipment_id: header.id,
        subject: `Pertanyaan Pengiriman #${header.assignment_no}`,
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

    const formatBadge = (status: string, label?: string) => {
        const text = (label || status || '').toUpperCase();
        if (text.includes('PERJALANAN') || text.includes('IN_PROGRESS')) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                    Dalam Perjalanan
                </span>
            );
        }
        if (text.includes('SELESAI') || text.includes('TERKIRIM') || text.includes('COMPLETED')) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                    Terkirim
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                {label || status}
            </span>
        );
    };

    return (
        <CustomerLayout title={`Detail #${header.assignment_no}`}>
            <Head title={`Detail Pengiriman #${header.assignment_no}`} />

            {/* Back Button */}
            <div className="mb-4">
                <Link
                    href="/customer/monitoring-barang"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Monitoring Barang</span>
                </Link>
            </div>

            {/* Header / Hero Overview Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                                #{header.assignment_no}
                            </span>
                            {formatBadge(header.status, header.status_label)}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {header.cargo_name}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            Kategori: {header.cargo_category} • Kuantitas: {header.total_quantity.toLocaleString('id-ID')} {header.unit}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setInquiryModalOpen(true)}
                            className="px-4 py-2 rounded-xl text-gray-900 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer hover:brightness-95"
                            style={{ backgroundColor: '#F6C343' }}
                        >
                            <MessageSquareQuote size={15} />
                            <span>Hubungi Admin GTD</span>
                        </button>
                    </div>
                </div>

                {/* Main Progress Bar */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span className="text-gray-500">Progres Pengiriman</span>
                        <span className="text-gray-900 font-bold">{header.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${header.progress_percentage}%`, backgroundColor: '#F6C343' }}
                        />
                    </div>
                </div>
            </div>

            {/* Info Grid (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Rute & Tujuan */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#F6C34322' }}
                        >
                            <MapPin size={18} style={{ color: '#F6C343' }} strokeWidth={2} />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rute Kargo</span>
                            <h4 className="text-xs font-bold text-gray-900">Asal ➔ Tujuan</h4>
                        </div>
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-700">
                        <div className="text-gray-900 font-semibold">{header.origin}</div>
                        <div className="text-gray-400 my-0.5">menuju</div>
                        <div className="text-gray-900 font-semibold">{header.destination}</div>
                    </div>
                </div>

                {/* Estimasi & Jadwal */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#6366f122' }}
                        >
                            <Calendar size={18} style={{ color: '#6366f1' }} strokeWidth={2} />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Jadwal &amp; Waktu</span>
                            <h4 className="text-xs font-bold text-gray-900">Estimasi Tiba (ETA)</h4>
                        </div>
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-700">
                        <div><span className="text-gray-400">Mulai:</span> {header.departure_date ?? 'Hari ini, 08:00'}</div>
                        <div className="mt-1"><span className="text-gray-400">Estimasi Selesai:</span> <span className="font-semibold text-gray-900">{header.eta ?? 'Besok, 16:00'}</span></div>
                    </div>
                </div>

                {/* Armada & PIC */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#10b98122' }}
                        >
                            <Truck size={18} style={{ color: '#10b981' }} strokeWidth={2} />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Armada Operasional</span>
                            <h4 className="text-xs font-bold text-gray-900">{header.driver_name || 'Driver GTD'}</h4>
                        </div>
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-700">
                        <div><span className="text-gray-400">Unit:</span> {header.vehicle_plate || 'Armada Logistik GTD'}</div>
                        <div className="mt-1"><span className="text-gray-400">Posisi:</span> <span className="font-semibold text-gray-900">{header.current_checkpoint}</span></div>
                    </div>
                </div>
            </div>

            {/* Checkpoints Timeline & Document Center Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                
                {/* Timeline Checkpoints (7 Cols) */}
                <div className="lg:col-span-7 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} style={{ color: '#F6C343' }} />
                            <h2 className="text-base font-semibold text-gray-800">Timeline Checkpoint</h2>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                            {checkpoints.filter((c) => c.status === 'passed').length} dari {checkpoints.length} Titik Terlewati
                        </span>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-gray-100">
                        {checkpoints.map((cp) => {
                            const isPassed = cp.status === 'passed';
                            const isCurrent = cp.status === 'current';

                            return (
                                <div key={cp.id} className="relative">
                                    {/* Icon Circle indicator */}
                                    <div
                                        className={`absolute -left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                                            isPassed
                                                ? 'bg-emerald-500 text-white'
                                                : isCurrent
                                                ? 'text-gray-900 ring-2 ring-yellow-300'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}
                                        style={{
                                            backgroundColor: isCurrent ? '#F6C343' : undefined,
                                        }}
                                    >
                                        {isPassed ? <CheckCircle2 size={13} /> : cp.sequence}
                                    </div>

                                    <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100/80">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-semibold text-gray-900">
                                                {cp.checkpoint_name}
                                            </h4>
                                            {isPassed && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600">
                                                    Selesai
                                                </span>
                                            )}
                                            {isCurrent && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800">
                                                    Posisi Saat Ini
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {cp.location}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-gray-200/60 text-xs">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block font-medium">PIC Checkpoint:</span>
                                                <span className="font-semibold text-gray-800">{cp.pic_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 block font-medium">Tanggal Aktual:</span>
                                                <span className="font-semibold text-gray-800">{cp.actual_arrival ?? '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Document Center (5 Cols) */}
                <div className="lg:col-span-5 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <FileCheck2 size={18} style={{ color: '#F6C343' }} />
                            <h2 className="text-base font-semibold text-gray-800">Document Center</h2>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                            {documents.verified_count} Diverifikasi
                        </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-4 font-normal">
                        Hanya berkas resmi yang telah diverifikasi final oleh tim operasional GTD yang dapat diunduh.
                    </p>

                    <div className="space-y-3 flex-1">
                        {documents.verified_documents.length === 0 ? (
                            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 text-center text-gray-400 text-xs">
                                <Lock size={20} className="mx-auto mb-2 opacity-40 text-gray-400" />
                                Belum ada dokumen final yang terverifikasi untuk sesi pengiriman ini.
                            </div>
                        ) : (
                            documents.verified_documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-3.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/70 border border-gray-100 flex items-center justify-between gap-3 transition-colors"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center shrink-0 font-bold text-xs">
                                            PDF
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-semibold text-gray-900 truncate">
                                                {doc.file_name}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {doc.document_type} • {doc.verified_at}
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href={doc.download_url}
                                        className="p-2 rounded-lg text-gray-900 text-xs font-semibold flex items-center justify-center shrink-0 transition-colors shadow-2xs hover:brightness-95"
                                        style={{ backgroundColor: '#F6C343' }}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-lg w-full">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-base">
                                Hubungi PIC Operasional GTD
                            </h3>
                            <button
                                onClick={() => setInquiryModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 text-sm font-semibold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitInquiry} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Subjek Pesan
                                </label>
                                <input
                                    type="text"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F5] border border-gray-200 text-xs text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Pesan / Pertanyaan
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Tuliskan pertanyaan operasional atau koordinasi kargo Anda..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F5] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:bg-white placeholder-gray-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setInquiryModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl text-gray-900 text-xs font-semibold cursor-pointer hover:brightness-95"
                                    style={{ backgroundColor: '#F6C343' }}
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
