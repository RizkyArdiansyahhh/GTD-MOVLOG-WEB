import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import type {
    ShipmentDetail,
    SessionUnitItem,
    ShipmentTimelineItem,
    VerifiedDocument,
} from '@/types/customer';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    FileText,
    Download,
    CheckCircle2,
    Clock,
    Truck,
    ShieldCheck,
    UserCheck,
    Package,
    ArrowRight,
    MessageSquare,
    Ship,
    Anchor,
} from 'lucide-react';

interface DetailShipmentProps {
    shipment: ShipmentDetail;
    units: SessionUnitItem[];
    timeline: ShipmentTimelineItem[];
    documents: VerifiedDocument[];
}

export default function DetailShipment({
    shipment,
    units = [],
    timeline = [],
    documents = [],
}: DetailShipmentProps) {
    useRealtimeUpdates();

    // Map semantic status badge (Clean text style without heavy pill backgrounds)
    const renderStatusBadge = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'IN_PROGRESS' || s === 'IN_TRANSIT' || s === 'DALAM PERJALANAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>In Transit</span>
                </span>
            );
        }
        if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'TERKIRIM') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Delivered</span>
                </span>
            );
        }
        if (s === 'CANCELLED' || s === 'DIBATALKAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>Cancelled</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Loading Preparation</span>
            </span>
        );
    };

    // Determine 4-Stage Intermodal Progress
    const totalNodes = timeline.length;
    const completedNodes = timeline.filter((t) => t.status === 'COMPLETED' || t.status === 'SELESAI').length;

    const stages = [
        { label: 'Vessel', desc: 'Loading & Sailing', icon: Ship },
        { label: 'Barge', desc: 'Transshipment', icon: Anchor },
        { label: 'Port', desc: 'Discharge & Transit', icon: MapPin },
        { label: 'Site', desc: 'Arrived at Destination', icon: Truck },
    ];

    const getStageStatus = (stageIdx: number) => {
        if (totalNodes === 0) return 'pending';
        const progressRatio = completedNodes / Math.max(1, totalNodes);
        const stageRatio = (stageIdx + 1) / 4;
        const prevStageRatio = stageIdx / 4;

        if (progressRatio >= stageRatio) return 'completed';
        if (progressRatio >= prevStageRatio) return 'in_progress';
        return 'pending';
    };

    return (
        <CustomerLayout title={`Detail #${shipment.assignment_no}`}>
            <Head title={`Detail Pengiriman #${shipment.assignment_no} — GTD Customer Portal`} />

            <div className="space-y-6">
                {/* ── Top Navigation / Back Link ── */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/customer/monitoring-barang"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Cargo Monitoring</span>
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Official Verified Documents</span>
                    </span>
                </div>

                {/* ── 1. Hero Operational Header ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="font-mono text-xs font-bold text-[#06283A] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                    #{shipment.assignment_no}
                                </span>
                                {renderStatusBadge(shipment.status)}
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#06283A] tracking-tight">
                                {shipment.cargo_name}
                            </h1>
                            <p className="text-xs text-slate-500 mt-1 font-normal">
                                Date Registered: <span className="font-semibold text-slate-800">{shipment.created_at}</span>
                            </p>
                        </div>

                        {/* Direct Contextual Support Action */}
                        <div className="flex items-center gap-2">
                            <a
                                href={`https://wa.me/6281234567890?text=Halo%20GTD%2C%20saya%20ingin%20koordinasi%20pengiriman%20%23${shipment.assignment_no}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                            >
                                <MessageSquare size={13} />
                                <span>Support for this Shipment</span>
                            </a>
                        </div>
                    </div>

                    {/* 4 Key Operational Metrics in Hero */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
                        {/* 1. Posisi Terkini */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Current Location
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-1 truncate">
                                <MapPin size={13} className="text-[#F6C343] shrink-0" />
                                <span className="truncate">{shipment.current_checkpoint || 'GTD Operations Post'}</span>
                            </div>
                        </div>

                        {/* 2. Estimasi Tiba (ETA) */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Estimated Arrival (ETA)
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mt-1">
                                <Calendar size={13} className="text-blue-600 shrink-0" />
                                <span>{shipment.eta || 'Not available yet'}</span>
                            </div>
                        </div>

                        {/* 3. Rute Kargo */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Transit Route
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-1 truncate">
                                <span className="truncate">{shipment.origin}</span>
                                <ArrowRight size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate">{shipment.destination}</span>
                            </div>
                        </div>

                        {/* 4. Total Muatan */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Total Cargo
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-1">
                                <Package size={13} className="text-slate-600 shrink-0" />
                                <span>
                                    {Number(shipment.total_quantity).toLocaleString('en-US')} {shipment.unit}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. 4-Milestone Intermodal Stepper ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
                        <h2 className="font-bold text-xs sm:text-sm text-[#06283A] uppercase tracking-wider">
                            Intermodal Journey Stages
                        </h2>
                        <span className="text-xs font-medium text-slate-500">
                            {completedNodes} of {totalNodes} Checkpoints Completed
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {stages.map((stg, idx) => {
                            const status = getStageStatus(idx);
                            const Icon = stg.icon;

                            return (
                                <div
                                    key={idx}
                                    className={`p-3.5 rounded-lg border transition-all ${
                                        status === 'completed'
                                            ? 'bg-emerald-50/60 border-emerald-200'
                                            : status === 'in_progress'
                                            ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                                            : 'bg-slate-50/70 border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div
                                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                                                status === 'completed'
                                                    ? 'bg-emerald-600 text-white'
                                                    : status === 'in_progress'
                                                    ? 'bg-[#F6C343] text-[#06283A]'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}
                                        >
                                            <Icon size={13} />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                                            {status === 'completed'
                                                ? 'Completed'
                                                : status === 'in_progress'
                                                ? 'In Progress'
                                                : 'Pending'}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-xs text-slate-900">
                                        {idx + 1}. {stg.label}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-normal">{stg.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── 3. Structured 2-Column Operational Summary ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Rute & Jadwal */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3.5">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                            Route &amp; Schedule Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Origin:</span>
                                <span className="font-semibold text-slate-900">{shipment.origin}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Final Destination:</span>
                                <span className="font-semibold text-slate-900">{shipment.destination}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Creation Date:</span>
                                <span className="font-medium text-slate-800">{shipment.created_at}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Estimated Arrival (ETA):</span>
                                <span className="font-semibold text-blue-800">{shipment.eta || 'Not determined yet'}</span>
                            </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 text-xs">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Operational Notes:</span>
                            <span className="text-slate-600 italic font-normal">{shipment.notes || 'No special instructions.'}</span>
                        </div>
                    </div>

                    {/* Right: Rincian Unit Muatan (Clean Manifest) */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                                Registered Cargo Manifest
                            </h3>
                            <div className="mt-3 space-y-2 text-xs">
                                {units.length === 0 ? (
                                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                        <span className="font-semibold text-slate-800">{shipment.cargo_name}</span>
                                        <span className="font-bold text-slate-900">
                                            {Number(shipment.total_quantity).toLocaleString('en-US')} {shipment.unit}
                                        </span>
                                    </div>
                                ) : (
                                    units.map((u, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium"
                                        >
                                            <span className="text-slate-800">{u.unit_name}</span>
                                            <span className="font-semibold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                                                ×{u.quantity}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-100 font-normal">
                            Total cargo volume verified by GTD Supervisor.
                        </p>
                    </div>
                </div>

                {/* ── 4. Vertical Timeline (7) vs Verified Document Vault (5) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Vertical Timeline (7 Columns) */}
                    <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-[#F6C343]" />
                                <h2 className="text-sm sm:text-base font-bold text-[#06283A]">
                                    Checkpoint Timeline
                                </h2>
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                                {completedNodes} of {totalNodes} Checkpoints Completed
                            </span>
                        </div>

                        <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                            {timeline.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-4">No checkpoints recorded yet.</p>
                            ) : (
                                timeline.map((node, idx) => {
                                    const isCompleted = node.status === 'COMPLETED' || node.status === 'SELESAI';
                                    const isInProgress = node.status === 'IN_PROGRESS' || node.status === 'SEDANG BERJALAN';

                                    return (
                                        <div key={idx} className="relative">
                                            {/* Status Node Icon */}
                                            <div
                                                className={`absolute -left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                                                    isCompleted
                                                        ? 'bg-emerald-600 text-white'
                                                        : isInProgress
                                                        ? 'bg-[#F6C343] text-slate-900'
                                                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                                                }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 size={13} />
                                                ) : isInProgress ? (
                                                    <Clock size={13} />
                                                ) : (
                                                    node.sequence
                                                )}
                                            </div>

                                            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-semibold text-slate-900">
                                                        {node.checkpoint_name}
                                                    </h4>
                                                    {isCompleted ? (
                                                        <span className="text-[10px] font-semibold text-emerald-700">
                                                            Selesai
                                                        </span>
                                                    ) : isInProgress ? (
                                                        <span className="text-[10px] font-semibold text-blue-700">
                                                            Sedang Berjalan
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-slate-500">
                                                            Menunggu
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200 text-xs">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Start Time:</span>
                                                        <span className="font-medium text-slate-800">{node.actual_start || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Completion Time:</span>
                                                        <span className="font-medium text-slate-800">{node.actual_finish || '-'}</span>
                                                    </div>
                                                </div>

                                                {node.pic_name && (
                                                    <div className="mt-2 text-[11px] text-slate-500 font-normal flex items-center gap-1">
                                                        <UserCheck size={12} className="text-slate-600" />
                                                        <span>Checkpoint PIC: <strong className="text-slate-800 font-medium">{node.pic_name}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Verified Document Vault (5 Columns) */}
                    <div className="lg:col-span-5 rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-slate-700" />
                                <h2 className="text-sm sm:text-base font-bold text-[#06283A]">
                                    Document Vault
                                </h2>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                {documents.length} Official Documents
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 font-normal leading-relaxed">
                            Only official documents verified and approved by the GTD Supervisor can be accessed and downloaded.
                        </p>

                        <div className="space-y-2.5 flex-1">
                            {documents.length === 0 ? (
                                <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                                    <ShieldCheck size={26} className="mx-auto mb-2 text-slate-400" />
                                    <p className="font-semibold text-slate-700">No verified documents available yet.</p>
                                    <p className="text-slate-400 mt-1">Documents will appear automatically once approved by the Supervisor.</p>
                                </div>
                            ) : (
                                documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                                    >
                                        <div className="overflow-hidden space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#0F172A] text-white uppercase">
                                                    {doc.document_type_code || 'DOC'}
                                                </span>
                                                <p className="text-xs font-semibold text-slate-900 truncate">
                                                    {doc.file_name}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate font-normal">
                                                {doc.document_type}
                                            </p>
                                            <p className="text-[10px] text-emerald-700 font-medium">
                                                Verified: {doc.verified_at} ({doc.verified_by})
                                            </p>
                                        </div>

                                        <a
                                            href={`/storage/${doc.file_path}`}
                                            download
                                            className="p-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-sm"
                                            title="Download Official Document"
                                        >
                                            <Download size={14} />
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
