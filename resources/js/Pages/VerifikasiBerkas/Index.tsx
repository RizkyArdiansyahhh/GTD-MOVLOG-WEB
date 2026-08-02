import { useState, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { FileCheck2, Filter, AlertCircle, Search } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';
import type { VerificationDocument, VerificationStatus, SupportedDocumentType } from './types';
import { mockDocuments } from './data/mockDocuments';
import DocumentList from './components/DocumentList';
import DocumentPagination from './components/DocumentPagination';
import DocumentPreview from './components/DocumentPreview';
import DocumentMetadata from './components/DocumentMetadata';
import DocumentActions from './components/DocumentActions';
import DocumentStatusModal from './components/DocumentStatusModal';
import ToastNotification, { type ToastMessage } from '../KelolaAkun/components/ToastNotification';

const ITEMS_PER_PAGE = 5;

const DOCUMENT_TYPES: (SupportedDocumentType | 'Semua Tipe')[] = [
    'Semua Tipe',
    'Insurance',
    'Certificate of Origin (COO)',
    'Packing List',
    'Commercial Invoice',
    'Bill of Lading',
];

export default function VerifikasiBerkasIndex() {
    const { auth } = usePage<PageProps>().props;

    // ── Supervisor Role Check ──
    const isSupervisor = useMemo(() => {
        if (!auth?.user) return true; // fallback for preview/testing
        const userRoles = (auth.user.roles || []).map((r) => r.toLowerCase());
        return userRoles.includes('supervisor');
    }, [auth]);

    // Documents state
    const [documents, setDocuments] = useState<VerificationDocument[]>(mockDocuments);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(
        mockDocuments.find((d) => d.status === 'Pending')?.id || mockDocuments[0]?.id || null
    );

    // Filter & Search state
    const [statusFilter, setStatusFilter] = useState<'All' | VerificationStatus>('All');
    const [typeFilter, setTypeFilter] = useState<SupportedDocumentType | 'Semua Tipe'>('Semua Tipe');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal & Toast state
    const [modalDoc, setModalDoc] = useState<VerificationDocument | null>(null);
    const [targetStatus, setTargetStatus] = useState<VerificationStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // Computed Stats
    const pendingCount = useMemo(
        () => documents.filter((d) => d.status === 'Pending').length,
        [documents]
    );

    // Filtered Documents
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchStatus = statusFilter === 'All' || doc.status === statusFilter;
            const matchType = typeFilter === 'Semua Tipe' || doc.documentType === typeFilter;
            const matchSearch =
                searchQuery === '' ||
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.shipmentReference.toLowerCase().includes(searchQuery.toLowerCase());

            return matchStatus && matchType && matchSearch;
        });
    }, [documents, statusFilter, typeFilter, searchQuery]);

    // Paginated Documents
    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE));
    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredDocuments, currentPage]);

    // Selected document object
    const selectedDocument = useMemo(() => {
        return documents.find((d) => d.id === selectedDocId) || paginatedDocuments[0] || null;
    }, [documents, selectedDocId, paginatedDocuments]);

    // Action handlers
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

        setTimeout(() => {
            setDocuments((prev) =>
                prev.map((item) =>
                    item.id === doc.id
                        ? { ...item, status, notes: notes || item.notes }
                        : item
                )
            );

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
        }, 300);
    };

    return (
        <DashboardLayout>
            <Head title="Verifikasi Berkas — Global Trans Djaya" />

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

            {!isSupervisor ? (
                /* ── Unauthorized Access Guard Screen ── */
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
            ) : (
                <>
                    {/* ──────── HEADER ──────── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1
                                className="text-[28px] font-semibold leading-tight"
                                style={{ color: '#06283A' }}
                            >
                                Verifikasi Berkas
                            </h1>
                            <p className="text-sm text-[#64748B] mt-1 font-normal">
                                Verifikasi kelengkapan dan keabsahan dokumen pengiriman sebelum persetujuan operasional.
                            </p>
                        </div>
                    </div>

                    {/* ──────── MASTER-DETAIL LAYOUT ──────── */}
                    {/* Desktop: Left 58%, Right 42%, Gap 20px, Equal height */}
                    <div className="flex flex-col lg:flex-row gap-[20px] items-stretch">
                        {/* ──────────────────────────────────────────────────────── */}
                        {/* LEFT PANEL (approx 58% on Desktop, 45% on Tablet, 100% Mobile) */}
                        {/* ──────────────────────────────────────────────────────── */}
                        <div className="w-full lg:w-[58%] md:w-[45%] bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between">
                            {/* Card Header */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileCheck2 size={20} className="text-[#F5B800]" strokeWidth={2.2} />
                                        <h2 className="text-[18px] font-semibold text-[#06283A]">
                                            Menunggu Verifikasi
                                        </h2>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                                        {pendingCount} Pending
                                    </span>
                                </div>

                                {/* Filters & Search Bar */}
                                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                                    {/* Search Input */}
                                    <div className="relative w-full sm:flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="Cari no. dok, judul, pengunggah..."
                                            className="w-full pl-8 pr-3 py-1.5 rounded-[8px] border border-[#E2E8F0] text-xs focus:border-[#F5B800] focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Status Filter Dropdown */}
                                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value as any);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full sm:w-auto px-2.5 py-1.5 rounded-[8px] border border-[#E2E8F0] text-xs text-gray-700 bg-white font-medium focus:border-[#F5B800] outline-none"
                                        >
                                            <option value="All">Semua Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>

                                        {/* Type Filter Dropdown */}
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => {
                                                setTypeFilter(e.target.value as any);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full sm:w-auto px-2.5 py-1.5 rounded-[8px] border border-[#E2E8F0] text-xs text-gray-700 bg-white font-medium focus:border-[#F5B800] outline-none max-w-[140px] truncate"
                                        >
                                            {DOCUMENT_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Vertically Scrollable Document List */}
                            <div className="my-2 flex-1 min-h-[360px] flex flex-col justify-between">
                                <DocumentList
                                    documents={paginatedDocuments}
                                    selectedDocument={selectedDocument}
                                    onSelectDocument={handleSelectDocument}
                                />
                            </div>

                            {/* Left Panel Pagination */}
                            <DocumentPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredDocuments.length}
                                onPageChange={(p) => setCurrentPage(p)}
                            />
                        </div>

                        {/* ──────────────────────────────────────────────────────── */}
                        {/* RIGHT PANEL (approx 42% on Desktop, 55% on Tablet, 100% Mobile) */}
                        {/* ──────────────────────────────────────────────────────── */}
                        <div className="w-full lg:w-[42%] md:w-[55%] bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between gap-4">
                            {/* Panel Header */}
                            <div>
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                                    <div>
                                        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                            {selectedDocument ? selectedDocument.documentNumber : 'No Document Selected'}
                                        </span>
                                        <h3 className="text-base font-semibold text-[#06283A] mt-1 truncate max-w-[280px]">
                                            {selectedDocument ? selectedDocument.title : 'Pratinjau Dokumen'}
                                        </h3>
                                    </div>
                                    {selectedDocument && (
                                        <span className="text-[11px] text-[#64748B] font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            {selectedDocument.documentType}
                                        </span>
                                    )}
                                </div>

                                {/* Embedded A4 Preview */}
                                <DocumentPreview document={selectedDocument} />
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
                </>
            )}
        </DashboardLayout>
    );
}
