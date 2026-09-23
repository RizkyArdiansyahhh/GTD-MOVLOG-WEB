import { useState } from 'react';
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
    Truck,
    ShieldCheck,
    UserCheck,
    Package,
    ArrowRight,
    MessageSquare,
    ChevronDown,
    BadgeCheck,
} from 'lucide-react';

interface CheckpointDetailProps {
    shipment: ShipmentDetail;
    units: SessionUnitItem[];
    timeline: ShipmentTimelineItem[];
    documents: VerifiedDocument[];
}

function isCompletedStatus(status: string): boolean {
    const s = (status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'SELESAI';
}

function isInProgressStatus(status: string): boolean {
    const s = (status || '').toUpperCase();
    return s === 'IN_PROGRESS' || s === 'SEDANG BERJALAN' || s === 'IN_TRANSIT' || s === 'AKTIF';
}

/** Days from today until an ETA string formatted as "d M Y" (e.g. "15 Jan 2026"). */
function daysUntilEta(eta: string | undefined): number | null {
    if (!eta) return null;
    const target = new Date(`${eta} 00:00:00`);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function etaCountdownLabel(eta: string | undefined): string | null {
    const days = daysUntilEta(eta);
    if (days === null) return null;
    if (days < 0) return 'Date passed';
    if (days === 0) return 'Arriving today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
}

export default function CheckpointDetail({
    shipment,
    units = [],
    timeline = [],
    documents = [],
}: CheckpointDetailProps) {
    useRealtimeUpdates();
    const [showAllHistory, setShowAllHistory] = useState(false);

    const pct = Math.min(100, Math.max(0, shipment.progress_percent ?? 0));
    const totalNodes = timeline.length;
    const completedNodes = timeline.filter((t) => isCompletedStatus(t.status)).length;

    // PIC of the currently active stage (in-progress node, else latest started one).
    const activeNode =
        timeline.find((t) => isInProgressStatus(t.status)) ??
        [...timeline].reverse().find((t) => t.actual_start) ??
        null;

    const visibleHistory = showAllHistory ? timeline : timeline.slice(0, 3);

    const renderStatusPill = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'IN_PROGRESS' || s === 'IN_TRANSIT' || s === 'DALAM PERJALANAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>IN TRANSIT</span>
                </span>
            );
        }
        if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'TERKIRIM') {
            return (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>DELIVERED</span>
                </span>
            );
        }
        if (s === 'CANCELLED' || s === 'DIBATALKAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-800 bg-red-100 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>CANCELLED</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>PREPARATION</span>
            </span>
        );
    };

    const renderHistoryStatus = (status: string) => {
        if (isCompletedStatus(status)) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                    Completed
                </span>
            );
        }
        if (isInProgressStatus(status)) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                    In Progress
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                Pending
            </span>
        );
    };

    const historyDescription = (node: ShipmentTimelineItem): string => {
        if (isCompletedStatus(node.status)) return `Cargo arrived at ${node.checkpoint_name}`;
        if (isInProgressStatus(node.status)) {
            return node.pic_name
                ? `Cargo currently at ${node.checkpoint_name} (PIC: ${node.pic_name})`
                : `Cargo currently at ${node.checkpoint_name}`;
        }
        return `Awaiting ${node.checkpoint_name} stage`;
    };

    const countdown = etaCountdownLabel(shipment.eta);

    return (
        <CustomerLayout title={`Tracking #${shipment.assignment_no}`}>
            <Head title={`Shipment Tracking #${shipment.assignment_no} — GTD Customer Portal`} />

            <div className="space-y-5">
                {/* ── Top Navigation ── */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Link
                        href="/customer/checkpoints"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Checkpoints</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <ShieldCheck size={13} className="text-emerald-600" />
                            <span>Official Verified Documents</span>
                        </span>
                        <a
                            href={`https://wa.me/6281234567890?text=Hello%20GTD%2C%20I%20would%20like%20to%20coordinate%20shipment%20%23${shipment.assignment_no}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                        >
                            <MessageSquare size={13} />
                            <span>Support</span>
                        </a>
                    </div>
                </div>

                {/* ── 1. Shipment Header + Progress ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Truck size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-medium">Session No.</p>
                                <h1 className="text-lg font-bold text-[#06283A] tracking-tight">
                                    {shipment.assignment_no}
                                </h1>
                            </div>
                        </div>
                        <div className="text-right">
                            {renderStatusPill(shipment.status)}
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                Last updated: <span className="font-medium text-slate-600">{shipment.updated_at ?? '-'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-[11px] text-slate-400 font-medium">Checkpoints passed</p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#F6C343] transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-[#06283A] shrink-0">{pct}% Journey</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                            <span>
                                <strong className="text-slate-800">{completedNodes} / {totalNodes}</strong> Checkpoints
                            </span>
                            <span>
                                Destination: <strong className="text-slate-800">{shipment.destination}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── 2. Info Cards: ETA / Position / PIC ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Calendar size={17} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-slate-400 font-medium">Estimated Arrival</p>
                            <p className="text-sm font-bold text-[#06283A] truncate">{shipment.eta || 'Not available yet'}</p>
                            {countdown && <p className="text-[11px] text-slate-500">{countdown}</p>}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <MapPin size={17} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-slate-400 font-medium">Current Position</p>
                            <p className="text-sm font-bold text-[#06283A] truncate">{shipment.current_checkpoint || 'GTD Operations Post'}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <UserCheck size={17} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                PIC Information
                                {activeNode?.pic_name && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-px rounded-full uppercase">
                                        <BadgeCheck size={9} />
                                        Verified
                                    </span>
                                )}
                            </p>
                            <p className="text-sm font-bold text-[#06283A] truncate">{activeNode?.pic_name ?? 'Not assigned yet'}</p>
                            {activeNode && (
                                <p className="text-[11px] text-slate-500 truncate">PIC for {activeNode.checkpoint_name} stage</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 3. Route + Cargo Detail ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-[#06283A]">Shipment Route</h2>
                            <ArrowRight size={15} className="text-slate-300" />
                        </div>
                        <dl className="text-xs">
                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                                <dt className="text-slate-400 font-medium">Origin</dt>
                                <dd className="font-bold text-slate-900 text-right">{shipment.origin}</dd>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                                <dt className="text-slate-400 font-medium">Destination</dt>
                                <dd className="font-bold text-slate-900 text-right">{shipment.destination}</dd>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <dt className="text-slate-400 font-medium">Transit Route</dt>
                                <dd className="font-bold text-slate-900 text-right truncate ml-4">
                                    {shipment.origin} <span className="text-slate-400 font-medium">→</span> {shipment.destination}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-[#06283A]">Cargo Detail</h2>
                            <Package size={15} className="text-slate-300" />
                        </div>
                        <dl className="text-xs">
                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 gap-3">
                                <dt className="text-slate-400 font-medium shrink-0">Cargo Type</dt>
                                <dd className="font-bold text-slate-900 text-right truncate">
                                    {units.length > 0
                                        ? `${units[0].unit_name}${units.length > 1 ? ` +${units.length - 1} more` : ''}`
                                        : shipment.cargo_name}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                                <dt className="text-slate-400 font-medium">Load Weight</dt>
                                <dd className="font-bold text-slate-900 text-right">
                                    {Number(shipment.total_quantity).toLocaleString('en-US')} {shipment.unit}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                                <dt className="text-slate-400 font-medium">Verified Docs</dt>
                                <dd className="font-bold text-emerald-700 text-right">{documents.length} Documents</dd>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <dt className="text-slate-400 font-medium">Fleet ID</dt>
                                <dd className="font-bold text-slate-900 text-right font-mono">{shipment.assignment_no}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* ── 4. Cargo Manifest (moved goods, merged from cargo detail) ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-[#06283A]">Cargo Manifest</h2>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {units.length > 0 ? `${units.length} Units` : 'Bulk Cargo'}
                        </span>
                    </div>
                    {units.length === 0 ? (
                        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <span className="font-semibold text-slate-800">{shipment.cargo_name}</span>
                            <span className="font-bold text-slate-900">
                                {Number(shipment.total_quantity).toLocaleString('en-US')} {shipment.unit}
                            </span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                        <th className="py-2 pr-4 font-semibold">Unit Name</th>
                                        <th className="py-2 pr-4 font-semibold text-right">Quantity</th>
                                        <th className="py-2 font-semibold">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {units.map((u, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0">
                                            <td className="py-2.5 pr-4 font-semibold text-slate-900">{u.unit_name}</td>
                                            <td className="py-2.5 pr-4 text-right font-bold text-slate-900">×{u.quantity}</td>
                                            <td className="py-2.5 text-slate-500 font-normal">{u.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin size={12} className="text-[#F6C343]" />
                            {shipment.origin} <ArrowRight size={11} className="text-slate-400" /> {shipment.destination}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            {shipment.eta ? `ETA ${shipment.eta}` : 'ETA not available yet'}
                        </span>
                    </div>
                </div>

                {/* ── 5. Checkpoint History ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-[#06283A] mb-3">Checkpoint History</h2>
                    {timeline.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No checkpoints recorded yet.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                            <th className="py-2 pr-4 font-semibold">Time &amp; Date</th>
                                            <th className="py-2 pr-4 font-semibold">Location</th>
                                            <th className="py-2 pr-4 font-semibold">Status</th>
                                            <th className="py-2 font-semibold">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleHistory.map((node, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 last:border-0">
                                                <td className="py-2.5 pr-4 font-medium text-slate-700 whitespace-nowrap">
                                                    {node.actual_finish ?? node.actual_start ?? '-'}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <span className="font-semibold text-slate-900">{node.checkpoint_name}</span>
                                                    {node.pic_name && (
                                                        <span className="block text-[11px] text-slate-400 font-normal">PIC: {node.pic_name}</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4">{renderHistoryStatus(node.status)}</td>
                                                <td className="py-2.5 text-slate-500 font-normal">{historyDescription(node)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {timeline.length > 3 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllHistory((v) => !v)}
                                    className="mt-3 mx-auto flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                                >
                                    <span>{showAllHistory ? 'Show Less' : 'View Full History'}</span>
                                    <ChevronDown size={14} className={`transition-transform ${showAllHistory ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* ── 6. Verified Document Vault ── */}
                <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col">
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
        </CustomerLayout>
    );
}
