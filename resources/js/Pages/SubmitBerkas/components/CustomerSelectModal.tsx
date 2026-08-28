import React, { useState } from 'react';
import axios from 'axios';
import { Building2, X, Plus } from 'lucide-react';
import type { Customer } from '../types/SubmitBerkas';

interface CustomerSelectModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onCustomerCreated: (customer: Customer) => void;
}

interface NewCustomerForm {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    picName: string;
}

const EMPTY_FORM: NewCustomerForm = {
    companyName: '',
    address: '',
    phone: '',
    email: '',
    picName: '',
};

export default function CustomerSelectModal({
    isOpen = true,
    onClose,
    onCustomerCreated
}: CustomerSelectModalProps) {
    const [form, setForm] = useState<NewCustomerForm>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFormChange = (field: keyof NewCustomerForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (formError) setFormError(null);
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.companyName.trim()) {
            setFormError('Nama perusahaan wajib diisi.');
            return;
        }

        setIsLoading(true);
        setFormError(null);

        try {
            const response = await axios.post('/submit-berkas/customers', {
                company_name: form.companyName.trim(),
                address: form.address.trim() || null,
                phone: form.phone.trim() || null,
                email: form.email.trim() || null,
                pic_name: form.picName.trim() || null,
            });

            const saved = response.data.customer;
            const newCustomer: Customer = {
                id: saved.id,
                companyName: saved.company_name || form.companyName.trim(),
                address: saved.address || form.address.trim(),
                phone: saved.phone || form.phone.trim(),
                email: saved.email || form.email.trim(),
                picName: saved.pic_name || form.picName.trim(),
            };

            // Berikan customer baru ke parent component (masuk ke list)
            onCustomerCreated(newCustomer);
            setForm(EMPTY_FORM);
            onClose();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                'Gagal menambahkan customer baru. Silakan coba lagi.';
            setFormError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(6, 40, 58, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: 480,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                }}
            >
                {/* Modal Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '18px 24px',
                        borderBottom: '1px solid #F1F5F9',
                        background: '#FAFBFC',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: '#FFF8EC',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#B7791F',
                            }}
                        >
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#06283A' }}>
                                Tambah Customer Baru
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                                Masukkan detail perusahaan untuk penugasan pengiriman
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94A3B8',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Input */}
                <form onSubmit={handleCreateCustomer} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                            Nama Perusahaan <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.companyName}
                            onChange={(e) => handleFormChange('companyName', e.target.value)}
                            placeholder="Contoh: PT Sumber Logistik Bersama"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                                Nama PIC
                            </label>
                            <input
                                type="text"
                                value={form.picName}
                                onChange={(e) => handleFormChange('picName', e.target.value)}
                                placeholder="Nama penanggung jawab"
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
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                                No. Telepon / WA
                            </label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => handleFormChange('phone', e.target.value)}
                                placeholder="08xxxxxxxxxx"
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
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                            Email Perusahaan
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            placeholder="admin@perusahaan.co.id"
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

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                            Alamat Lengkap
                        </label>
                        <textarea
                            rows={2}
                            value={form.address}
                            onChange={(e) => handleFormChange('address', e.target.value)}
                            placeholder="Jl. Industri Raya Blok A No. 12, Jakarta"
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: 8,
                                border: '1px solid #E2E8F0',
                                fontSize: 13,
                                outline: 'none',
                                boxSizing: 'border-box',
                                resize: 'none'
                            }}
                        />
                    </div>

                    {formError && (
                        <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 12 }}>
                            {formError}
                        </div>
                    )}

                    {/* Footer Tombol Aksi */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            style={{
                                padding: '9px 16px',
                                borderRadius: 8,
                                border: '1px solid #E2E8F0',
                                background: '#FFFFFF',
                                color: '#475569',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '9px 18px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#B7791F',
                                color: '#FFFFFF',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                            }}
                        >
                            <Plus size={15} />
                            {isLoading ? 'Menyimpan...' : 'Simpan Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
