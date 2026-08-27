import React, { useState } from 'react';
import {
    Users,
    Plus,
    ArrowRight,
    Check,
    Building2,
    Sparkles,
    Phone,
    Mail
} from 'lucide-react';
import type { Customer } from '../types/SubmitBerkas';

interface CustomerActionPanelProps {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer) => void;
    onOpenCreateModal: () => void;
    onStartWizard: () => void;
    isLoading?: boolean;
}

export function CustomerActionPanel({
    customers = [],
    selectedCustomer,
    onSelectCustomer,
    onOpenCreateModal,
    onStartWizard,
    isLoading = false
}: CustomerActionPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCustomers = customers.filter((c) =>
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.picName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            {/* Header Panel */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#FFF8EC',
                        color: '#B7791F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#06283A' }}>
                        Mulai Penugasan
                    </h3>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                    Pilih customer yang menjadi pemilik dokumen untuk memulai proses input berkas pengiriman.
                </p>
            </div>

            {/* Search Input Customer */}
            <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Cari Customer Terdaftar
                </label>
                <input
                    type="text"
                    placeholder="Ketik nama perusahaan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* List Pilihan Customer */}
            <div style={{
                maxHeight: 200,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingRight: 4
            }}>
                {filteredCustomers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#94A3B8' }}>
                        Customer tidak ditemukan
                    </div>
                ) : (
                    filteredCustomers.map((cust) => {
                        const isSelected = selectedCustomer?.id === cust.id;
                        return (
                            <button
                                key={cust.id}
                                type="button"
                                onClick={() => onSelectCustomer(cust)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: isSelected ? '2px solid #B7791F' : '1px solid #E2E8F0',
                                    background: isSelected ? '#FFF8EC' : '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#B7791F' : '#1E293B' }}>
                                        {cust.companyName}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                        PIC: {cust.picName || '-'}
                                    </div>
                                </div>
                                {isSelected && <Check size={16} color="#B7791F" />}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Tombol Tambah Customer Baru */}
            <button
                type="button"
                onClick={onOpenCreateModal}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px dashed #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Plus size={14} />
                + Tambah Customer Baru
            </button>

            {/* Summary Customer yang Terpilih */}
            {selectedCustomer && (
                <div style={{
                    padding: 12,
                    background: '#F1F5F9',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Customer Terpilih:
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#06283A' }}>
                        {selectedCustomer.companyName}
                    </div>
                    {selectedCustomer.phone && (
                        <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} /> {selectedCustomer.phone}
                        </div>
                    )}
                </div>
            )}

            {/* Tombol CTA Utama: Mulai Submit Berkas */}
            <button
                type="button"
                onClick={onStartWizard}
                disabled={!selectedCustomer || isLoading}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: selectedCustomer && !isLoading
                        ? 'linear-gradient(135deg, #06283A 0%, #0B4666 100%)'
                        : '#CBD5E1',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: selectedCustomer && !isLoading ? 'pointer' : 'not-allowed',
                    boxShadow: selectedCustomer ? '0 4px 12px rgba(6, 40, 58, 0.15)' : 'none',
                    transition: 'all 0.2s'
                }}
            >
                {isLoading ? (
                    'Menyiapkan Assignment...'
                ) : (
                    <>
                        <Sparkles size={16} color="#FCD34D" />
                        Mulai Submit Berkas
                        <ArrowRight size={15} />
                    </>
                )}
            </button>
        </div>
    );
}
