import React, { useMemo, useState, useEffect } from 'react';
import {
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Inbox,
    Building2,
    Calendar,
    Edit3,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import type { AssignmentSummary } from '../types/SubmitBerkas';

interface DocumentAssignmentTableProps {
    assignments: AssignmentSummary[];
    onOpenAssignment?: (assignment: AssignmentSummary) => void;
}

const ITEMS_PER_PAGE = 5;

export function DocumentAssignmentTable({ assignments = [], onOpenAssignment }: DocumentAssignmentTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DRAFT' | 'VERIFIED' | 'REJECTED'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data berdasarkan query pencarian dan status filter
    const filteredData = useMemo(() => {
        return assignments.filter((item) => {
            const matchSearch =
                item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.assignment_no_ref.toLowerCase().includes(searchQuery.toLowerCase());

            const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [assignments, searchQuery, statusFilter]);

    // Reset ke halaman 1 jika filter atau pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Kalkulasi Pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedData = useMemo(() => {
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, startIndex]);

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'REJECTED':
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA'
                    }}>
                        <AlertCircle size={12} />
                        PERLU REVISI
                    </span>
                );
            case 'PENDING':
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A'
                    }}>
                        <Clock size={12} />
                        PENDING
                    </span>
                );
            case 'VERIFIED':
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#DCFCE7',
                        color: '#166534',
                        border: '1px solid #BBF7D0'
                    }}>
                        <CheckCircle2 size={12} />
                        VERIFIED
                    </span>
                );
            default:
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #E2E8F0'
                    }}>
                        <FileText size={12} />
                        DRAFT
                    </span>
                );
        }
    };

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
        }}>
            {/* Header Tabel & Filter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#06283A' }}>
                        Daftar Berkas Penugasan
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                        Klik baris atau tombol aksi untuk melihat atau merevisi berkas
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Search Input */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12 }} />
                        <input
                            type="text"
                            placeholder="Cari PT atau No. Ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '8px 12px 8px 34px',
                                borderRadius: 10,
                                border: '1px solid #E2E8F0',
                                fontSize: 13,
                                width: 220,
                                outline: 'none',
                                color: '#1E293B'
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                            fontSize: 13,
                            background: '#F8FAFC',
                            color: '#334155',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="REJECTED">Perlu Revisi</option>
                        <option value="PENDING">Pending</option>
                        <option value="DRAFT">Draft</option>
                        <option value="VERIFIED">Verified</option>
                    </select>
                </div>
            </div>

            {/* Konten: Tabel atau Empty State */}
            {filteredData.length === 0 ? (
                <div style={{
                    padding: '50px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    borderRadius: 12,
                    border: '1px dashed #CBD5E1'
                }}>
                    <div style={{
                        width: 54,
                        height: 54,
                        borderRadius: '50%',
                        background: '#FFF8EC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 14,
                        color: '#B7791F'
                    }}>
                        <Inbox size={26} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                        Belum Ada Dokumen Penugasan
                    </h3>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', maxWidth: 360, lineHeight: 1.5 }}>
                        Pilih customer atau buat customer baru di panel sebelah kanan untuk mulai menginput berkas pengiriman.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>No. Penugasan</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nama Customer</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dokumen</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Waktu Submit</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((item) => (
                                    <tr
                                        key={item.assignment_no_ref}
                                        onClick={() => onOpenAssignment && onOpenAssignment(item)}
                                        style={{
                                            borderBottom: '1px solid #F1F5F9',
                                            fontSize: 13,
                                            cursor: onOpenAssignment ? 'pointer' : 'default',
                                            transition: 'background 0.2s'
                                        }}
                                        className="hover:bg-slate-50"
                                    >
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ fontWeight: 700, color: '#06283A' }}>
                                                {item.assignment_no_ref}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Building2 size={15} color="#64748B" />
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{item.customer_name}</div>
                                                    {item.customer_pic && (
                                                        <div style={{ fontSize: 11, color: '#94A3B8' }}>PIC: {item.customer_pic}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>
                                            <span style={{ color: '#0284C7' }}>{item.total_documents}</span> / 5 Berkas
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {renderStatusBadge(item.status)}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Calendar size={13} color="#94A3B8" />
                                                {item.created_at ? new Date(item.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {item.status === 'REJECTED' ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenAssignment && onOpenAssignment(item);
                                                    }}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '6px 12px',
                                                        borderRadius: 8,
                                                        border: '1px solid #FCA5A5',
                                                        background: '#FEF2F2',
                                                        color: '#DC2626',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Edit3 size={13} />
                                                    Revisi
                                                </button>
                                            ) : item.status === 'DRAFT' ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenAssignment && onOpenAssignment(item);
                                                    }}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '6px 12px',
                                                        borderRadius: 8,
                                                        border: '1px solid #CBD5E1',
                                                        background: '#F8FAFC',
                                                        color: '#0284C7',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Edit3 size={13} />
                                                    Lanjutkan
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenAssignment && onOpenAssignment(item);
                                                    }}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '6px 12px',
                                                        borderRadius: 8,
                                                        border: '1px solid #E2E8F0',
                                                        background: '#FFFFFF',
                                                        color: '#64748B',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Eye size={13} />
                                                    Lihat
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bar Navigasi Pagination (Hanya muncul jika total items > 5) */}
                    {totalItems > ITEMS_PER_PAGE && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 12,
                            borderTop: '1px solid #F1F5F9',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                                Menampilkan <strong style={{ color: '#0F172A' }}>{startIndex + 1}</strong> - <strong style={{ color: '#0F172A' }}>{endIndex}</strong> dari <strong style={{ color: '#0F172A' }}>{totalItems}</strong> penugasan
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        border: '1px solid #E2E8F0',
                                        background: '#FFFFFF',
                                        color: currentPage === 1 ? '#CBD5E1' : '#334155',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <ChevronLeft size={14} />
                                    Sebelumnya
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNum)}
                                        style={{
                                            width: 30,
                                            height: 30,
                                            borderRadius: 8,
                                            border: currentPage === pageNum ? 'none' : '1px solid #E2E8F0',
                                            background: currentPage === pageNum ? '#06283A' : '#FFFFFF',
                                            color: currentPage === pageNum ? '#FFFFFF' : '#475569',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        border: '1px solid #E2E8F0',
                                        background: '#FFFFFF',
                                        color: currentPage === totalPages ? '#CBD5E1' : '#334155',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Berikutnya
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
