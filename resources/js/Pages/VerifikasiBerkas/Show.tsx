import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Ship,
    ArrowRight,
    CheckCircle2,
    Clock,
    XCircle,
    FileCheck2,
    AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';
import type { VerificationDocument, VerificationStatus } from './types';
import { useDocumentStore } from './hooks/useDocumentStore';
import { groupDocumentsByShipment, detectFieldMismatches } from './utils/shipmentUtils';
import DocumentList from './components/DocumentList';
import DocumentPagination from './components/DocumentPagination';
import DocumentPreview from './components/DocumentPreview';
import DocumentMetadata from './components/DocumentMetadata';
import DocumentActions from './components/DocumentActions';
import DocumentStatusModal from './components/DocumentStatusModal';
import MismatchWarnings from './components/MismatchWarnings';
import ToastNotification, { type ToastMessage } from '../KelolaAkun/components/ToastNotification';

const ITEMS_PER_PAGE = 5;

interface ShowProps {
    contractNumber: string;
}

export default function VerifikasiBerkasShow({ contractNumber }: ShowProps) {
    const { auth } = usePage<PageProps>().props;

    // ── Supervisor Role Check ──
    const isSupervisor = useMemo(() => {
        if (!auth?.user) return true;
        const userRoles = (auth.user.roles || []).map((r) => r.toLowerCase());
        return userRoles.includes('supervisor');
    }, [auth]);

    // ── All Documents State ──
    const [allDocuments, updateDocumentStatus] = useDocumentStore();

    // Get shipment group for this contract number (5 documents)
    const shipmentGroup = useMemo(() => {
        const groups = groupDocumentsByShipment(allDocuments);
        return groups.find((g) => g.contractNumber === contractNumber) || null;
    }, [allDocuments, contractNumber]);

    const shipmentDocuments = shipmentGroup?.documents || [];

    // ── Selected document ──
    const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
        const initialGroups = groupDocumentsByShipment(allDocuments);
        const currentGroup = initialGroups.find((g) => g.contractNumber === contractNumber);
        const docs = currentGroup?.documents || [];
        const pendingDoc = docs.find((d) => d.status === 'Pending');
        return pendingDoc?.id || docs[0]?.id || null;
    });

    // ── Pagination ──
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(shipmentDocuments.length / ITEMS_PER_PAGE));
    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return shipmentDocuments.slice(start, start + ITEMS_PER_PAGE);
    }, [shipmentDocuments, currentPage]);

    const selectedDocument = useMemo(() => {
        return shipmentDocuments.find((d) => d.id === selectedDocId) || paginatedDocuments[0] || null;
    }, [shipmentDocuments, selectedDocId, paginatedDocuments]);

    // ── Modal & Toast ──
    const [modalDoc, setModalDoc] = useState<VerificationDocument | null>(null);
    const [targetStatus, setTargetStatus] = useState<VerificationStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // ── Mismatch warnings for selected document ──
    const mismatchWarnings = useMemo(() => {
        if (!selectedDocument) return [];
        const approvedDocs = shipmentDocuments.filter(
            (d) => d.status === 'Approved' && d.id !== selectedDocument.id
        );
        if (approvedDocs.length === 0) return [];
        return detectFieldMismatches(selectedDocument, approvedDocs);
    }, [selectedDocument, shipmentDocuments]);

    // ── Progress stats ──
    const approvedCount = shipmentGroup?.approvedCount ?? 0;
    const pendingCount = shipmentGroup?.pendingCount ?? 0;
    const rejectedCount = shipmentGroup?.rejectedCount ?? 0;

    let progressTextColor = 'text-slate-500';
    if (approvedCount === 5) {
        progressTextColor = 'text-emerald-600';
    } else if (rejectedCount > 0) {
        progressTextColor = 'text-rose-600';
    } else if (pendingCount > 0) {
        progressTextColor = 'text-amber-600';
    }

    // ── Handlers ──
    const handleSelectDocument = (doc: VerificationDocument) => {
        setSelectedDocId(doc.id);
    };

    const handleOpenApproveModal = (doc: VerificationDocument) => {
        setModalDoc(doc);
        setTargetStatus('Approved');
    };

    const handleOpenRejectModal = (doc: VerificationDocument) => {
        setModalDoc(doc);
        setTargetStatus('Rejected');
    };

    const handleConfirmStatusChange = (
        doc: VerificationDocument,
        status: VerificationStatus,
        notes: string
    ) => {
        setIsSubmitting(true);

        const supervisorName = auth?.user?.name || 'Supervisor Logistik';
        const nowFormatted = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }) + ' WIB';

        // Persist to localStorage via hook
        updateDocumentStatus(doc.id, status, notes || '', supervisorName, nowFormatted);

        setIsSubmitting(false);
        setModalDoc(null);
        setTargetStatus(null);

        const isApproval = status === 'Approved';
        setToast({
            id: String(Date.now()),
            type: isApproval ? 'success' : 'error',
            message: isApproval
                ? `Berkas ${doc.documentNumber} (${doc.documentType}) berhasil disetujui.`
                : `Berkas ${doc.documentNumber} (${doc.documentType}) ditolak.`,
        });
    };

    // ── Back navigation ──
    const handleBack = () => {
        router.visit('/verifikasi-berkas');
    };

    if (!isSupervisor) {
        return (
            <DashboardLayout>
                <Head title="Verifikasi Berkas — Global Trans Djaya" />
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center my-8">
                    <div
                        className="flex items-center justify-center rounded-full mx-auto mb-4"
                        style={{ width: 56, height: 56, backgroundColor: '#fef2f2' }}
                    >
                        <AlertCircle size={28} className="text-red-500" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Akses Ditolak</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Halaman <strong>Verifikasi Berkas</strong> hanya dapat diakses oleh pengguna dengan role <strong>Supervisor</strong>.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    if (!shipmentGroup) {
        return (
            <DashboardLayout>
                <Head title="Shipment Tidak Ditemukan — Global Trans Djaya" />
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center my-8">
                    <div
                        className="flex items-center justify-center rounded-full mx-auto mb-4 bg-gray-100 text-gray-400"
                        style={{ width: 56, height: 56 }}
                    >
                        <Ship size={28} strokeWidth={1.8} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Shipment Tidak Ditemukan</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                        Kontrak <strong>{contractNumber}</strong> tidak ditemukan dalam sistem.
                    </p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        Kembali ke Daftar
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const polShort = shipmentGroup.portOfLoading.split(',')[0];
    const podShort = shipmentGroup.portOfDischarge.split(',')[0];

    return (
        <DashboardLayout>
            <Head title={`${contractNumber} — Verifikasi Berkas`} />

            {/* Toast Notification */}
            <ToastNotification toast={toast} onClose={() => setToast(null)} />

            {/* Verification Status Confirmation Modal */}
            <DocumentStatusModal
                isOpen={modalDoc !== null}
                document={modalDoc}
                targetStatus={targetStatus}
                onClose={() => {
                    setModalDoc(null);
                    setTargetStatus(null);
                }}
                onConfirm={handleConfirmStatusChange}
                isSubmitting={isSubmitting}
            />

            {/* ──────── HEADER ──────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="w-8 h-8 shrink-0 rounded-lg bg-white border border-[#E2E8F0] text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        title="Kembali ke daftar shipment"
                    >
                        <ArrowLeft size={15} strokeWidth={2} />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1
                                className="text-[20px] font-semibold leading-tight"
                                style={{ color: '#06283A' }}
                            >
                                {contractNumber}
                            </h1>
                            {/* Plain text progress indicator */}
                            <span className={`text-xs font-semibold ${progressTextColor}`}>
                                {approvedCount}/5 lengkap
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <span className="font-normal text-slate-600">{polShort}</span>
                            <ArrowRight size={11} className="text-slate-400" />
                            <span className="font-normal text-slate-600">{podShort}</span>
                            <span className="text-slate-300 mx-1">•</span>
                            <span className="text-slate-400">{shipmentGroup.shipperName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ──────── MASTER-DETAIL LAYOUT ──────── */}
            <div className="flex flex-col lg:flex-row gap-[20px] items-stretch">
                {/* ── LEFT PANEL: 5 Required Document Slots ── */}
                <div className="w-full lg:w-[58%] md:w-[45%] bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between">
                    {/* Card Header */}
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileCheck2 size={18} className="text-slate-600" strokeWidth={2} />
                                <h2 className="text-[16px] font-semibold text-[#06283A] leading-tight">
                                    Dokumen Shipment
                                </h2>
                            </div>

                            {/* Minimalist plain-text counter items (no solid pills) */}
                            <div className="flex items-center gap-3.5 text-xs">
                                {pendingCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-slate-500">
                                        <Clock size={12} className="text-amber-500" />
                                        <span>{pendingCount} pending</span>
                                    </span>
                                )}
                                {approvedCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span>{approvedCount} approved</span>
                                    </span>
                                )}
                                {rejectedCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                                        <XCircle size={12} className="text-rose-500" />
                                        <span>{rejectedCount} ditolak</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Document List */}
                    <div className="my-2 flex-1 min-h-[360px] flex flex-col justify-between">
                        <DocumentList
                            documents={paginatedDocuments}
                            selectedDocument={selectedDocument}
                            onSelectDocument={handleSelectDocument}
                        />
                    </div>

                    {/* Pagination */}
                    <DocumentPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={shipmentDocuments.length}
                        onPageChange={(p) => setCurrentPage(p)}
                    />
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="w-full lg:w-[42%] md:w-[55%] bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between gap-4">
                    {/* Panel Header */}
                    <div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                            <div>
                                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {selectedDocument?.documentNumber || 'No Document Selected'}
                                </span>
                                <h3 className="text-base font-semibold text-[#06283A] mt-1.5 truncate max-w-[280px]">
                                    {selectedDocument ? selectedDocument.title : 'Pratinjau Dokumen'}
                                </h3>
                            </div>
                            {selectedDocument && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {selectedDocument.documentType}
                                </span>
                            )}
                        </div>

                        {/* Embedded A4 Preview */}
                        <DocumentPreview document={selectedDocument} />

                        {/* Mismatch Warnings (shown below preview for uploaded docs) */}
                        <MismatchWarnings warnings={mismatchWarnings} />
                    </div>

                    {/* Metadata Section */}
                    <DocumentMetadata document={selectedDocument} />

                    {/* Action Buttons */}
                    <DocumentActions
                        document={selectedDocument}
                        onApprove={handleOpenApproveModal}
                        onReject={handleOpenRejectModal}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
