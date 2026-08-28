import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { FileCheck2, Search, AlertCircle, Ship, Clock } from 'lucide-react';
import './shipment-table.css';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';
import type { VerificationDocument } from './types';
import { groupDocumentsByShipment } from './utils/shipmentUtils';
import ShipmentCard from './components/ShipmentCard';

type ShipmentFilter = 'All' | 'Needs Revision' | 'Pending Verification' | 'Completed';

interface IndexProps extends PageProps {
    documents: VerificationDocument[];
}

export default function VerifikasiBerkasIndex() {
    const { auth, documents = [] } = usePage<IndexProps>().props;

    // ── Supervisor Role Check ──
    const isSupervisor = useMemo(() => {
        if (!auth?.user) return true;
        const userRoles = (auth.user.roles || []).map((r) => r.toLowerCase());
        return userRoles.includes('supervisor') || userRoles.includes('super-admin');
    }, [auth]);

    // ── State ──
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ShipmentFilter>('All');

    // ── Group documents into shipments ──
    const shipmentGroups = useMemo(
        () => groupDocumentsByShipment(documents),
        [documents]
    );

    // ── Filtered shipments ──
    const filteredShipments = useMemo(() => {
        return shipmentGroups.filter((group) => {
            if (statusFilter === 'Needs Revision') {
                if (group.rejectedCount === 0) return false;
            }
            if (statusFilter === 'Pending Verification') {
                if (group.pendingCount === 0) return false;
            }
            if (statusFilter === 'Completed') {
                if (group.approvedCount !== group.totalDocuments) return false;
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchContract = group.contractNumber.toLowerCase().includes(q);
                const matchShipper = group.shipperName.toLowerCase().includes(q);
                const matchCustomer = group.customerName.toLowerCase().includes(q);
                const matchConsignee = group.consigneeName.toLowerCase().includes(q);
                const matchPort =
                    group.portOfLoading.toLowerCase().includes(q) ||
                    group.portOfDischarge.toLowerCase().includes(q);
                const matchDocNumber = group.documents.some((d) =>
                    d.documentNumber.toLowerCase().includes(q)
                );
                if (!matchContract && !matchCustomer && !matchShipper && !matchConsignee && !matchPort && !matchDocNumber) {
                    return false;
                }
            }

            return true;
        });
    }, [shipmentGroups, statusFilter, searchQuery]);

    // ── Summary Stats ──
    const pendingVerificationCount = useMemo(
        () => shipmentGroups.filter((g) => g.pendingCount > 0).length,
        [shipmentGroups]
    );

    // ── Navigate to shipment detail ──
    const handleCardClick = (contractNumber: string) => {
        router.visit(`/verifikasi-berkas/${encodeURIComponent(contractNumber)}`);
    };

    return (
        <DashboardLayout title="Document Verification">
            <Head title="Document Verification — Global Trans Djaya" />

            {!isSupervisor ? (
                /* ── Unauthorized Access Guard Screen ── */
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center my-8">
                    <div
                        className="flex items-center justify-center rounded-full mx-auto mb-4"
                        style={{ width: 56, height: 56, backgroundColor: '#fef2f2' }}
                    >
                        <AlertCircle size={28} className="text-red-500" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Access Denied</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        The <strong>Document Verification</strong> page is restricted to users with the <strong>Supervisor</strong> role.
                    </p>
                </div>
            ) : (
                <>
                    {/* ──────── HEADER ──────── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1
                                className="text-[24px] font-semibold leading-tight"
                                style={{ color: '#06283A' }}
                            >
                                Document Verification
                            </h1>
                            <p className="text-xs text-slate-500 mt-1 font-normal">
                                Verify the completeness and validity of submitted shipment documents.
                            </p>
                        </div>

                        {pendingVerificationCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <Clock size={12} className="text-amber-600" />
                                <span>{pendingVerificationCount} shipment(s) pending verification</span>
                            </span>
                        )}
                    </div>

                    {/* ──────── FILTERS & SEARCH ──────── */}
                    <div className="bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm p-4 mb-5">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* Search */}
                            <div className="relative w-full sm:flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search contract no, customer, shipper, port, document no..."
                                    className="w-full pl-8 pr-3 py-1.5 rounded-[6px] border border-slate-200 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                                />
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                                {(
                                    [
                                        'All',
                                        'Needs Revision',
                                        'Pending Verification',
                                        'Completed',
                                    ] as ShipmentFilter[]
                                ).map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setStatusFilter(f)}
                                        className={[
                                            'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border cursor-pointer',
                                            statusFilter === f
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ──────── SHIPMENT LIST HEADER ──────── */}
                    <div className="flex items-center justify-between mb-3 px-0.5">
                        <div className="flex items-center gap-2">
                            <FileCheck2 size={16} className="text-slate-600" strokeWidth={2} />
                            <h2 className="text-sm font-semibold text-[#06283A]">
                                Shipment Queue
                            </h2>
                            <span className="text-xs text-slate-400 font-normal ml-0.5">
                                ({filteredShipments.length})
                            </span>
                        </div>
                    </div>

                    {/* ──────── SHIPMENT CARDS STACK ──────── */}
                    {filteredShipments.length === 0 ? (
                        <div className="bg-white rounded-[10px] border border-dashed border-slate-200 shadow-sm p-8 text-center">
                            <div
                                className="flex items-center justify-center rounded-full mx-auto mb-3 bg-slate-100 text-slate-400"
                                style={{ width: 44, height: 44 }}
                            >
                                <Ship size={22} strokeWidth={1.6} />
                            </div>
                            <p className="text-sm font-medium text-slate-800">No pending documents</p>
                            <p className="text-xs text-slate-500 mt-1">
                                There are currently no documents waiting for verification.
                            </p>
                        </div>
                    ) : (
                        <div className="shipment-cards-list flex flex-col gap-2 w-full">
                            {filteredShipments.map((group) => (
                                <ShipmentCard
                                    key={group.contractNumber}
                                    shipment={group}
                                    onClick={handleCardClick}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
