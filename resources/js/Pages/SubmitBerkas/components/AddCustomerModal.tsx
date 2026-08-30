import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Building2, X, Plus, CheckCircle2 } from 'lucide-react';
import type { Customer } from '../types/SubmitBerkas';

interface AddCustomerModalProps {
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

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

const EMPTY_FORM: NewCustomerForm = {
    companyName: '',
    address: '',
    phone: '',
    email: '',
    picName: '',
};

const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 15;

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 40, 58, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
    } as React.CSSProperties,
    modal: {
        background: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        position: 'relative', // Penting untuk layout
    } as React.CSSProperties,
    // --- Style baru untuk Floating Toast (Pesan Sukses) ---
    toast: {
        position: 'fixed',
        top: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100, // Harus lebih tinggi dari modal (1000)
        background: '#10B981', // Warna hijau emerald
        color: '#FFFFFF',
        padding: '12px 24px',
        borderRadius: 50, // Bentuk pil agar modern
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
        fontWeight: 600,
        fontSize: 14,
        animation: 'slideDown 0.3s ease-out forwards',
    } as React.CSSProperties,
    // -----------------------------------------------------
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderBottom: '1px solid #F1F5F9',
        background: '#FAFBFC',
    } as React.CSSProperties,
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    } as React.CSSProperties,
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: '#FFF8EC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#B7791F',
    } as React.CSSProperties,
    title: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: '#06283A',
    } as React.CSSProperties,
    subtitle: {
        margin: '2px 0 0',
        fontSize: 12,
        color: '#64748B',
    } as React.CSSProperties,
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94A3B8',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as React.CSSProperties,
    form: {
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    } as React.CSSProperties,
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#334155',
        marginBottom: 5,
    } as React.CSSProperties,
    required: {
        color: '#DC2626',
    } as React.CSSProperties,
    input: {
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
    } as React.CSSProperties,
    textarea: {
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'none',
    } as React.CSSProperties,
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    } as React.CSSProperties,
    errorBox: {
        padding: '8px 12px',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 8,
        color: '#DC2626',
        fontSize: 12,
    } as React.CSSProperties,
    fieldError: {
        margin: '4px 0 0',
        fontSize: 11,
        color: '#DC2626',
    } as React.CSSProperties,
    inputError: {
        border: '1px solid #FCA5A5',
    } as React.CSSProperties,
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 8,
    } as React.CSSProperties,
    cancelButton: (disabled: boolean): React.CSSProperties => ({
        padding: '9px 16px',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        color: '#475569',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
    }),
    submitButton: (disabled: boolean): React.CSSProperties => ({
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
    }),
};

export function AddCustomerModal({
    isOpen = false,
    onClose,
    onCustomerCreated
}: AddCustomerModalProps) {
    const [form, setForm] = useState<NewCustomerForm>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    if (!isOpen) return null;

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormError(null);
        setPhoneError(null);
        setSuccessMsg(null);
    };

    const handleFormChange = (field: keyof NewCustomerForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (formError) setFormError(null);
        if (field === 'phone' && phoneError) setPhoneError(null);
    };

    const validatePhone = (phone: string): string | null => {
        if (!phone.trim()) return null;
        const length = phone.trim().length;
        if (length < PHONE_MIN_LENGTH) {
            return `Minimal ${PHONE_MIN_LENGTH} karakter.`;
        }
        if (length > PHONE_MAX_LENGTH) {
            return `Maksimal ${PHONE_MAX_LENGTH} karakter.`;
        }
        return null;
    };

    const handleClose = () => {
        abortControllerRef.current?.abort();
        resetForm();
        onClose();
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.companyName.trim()) {
            setFormError('Nama perusahaan wajib diisi.');
            return;
        }

        const phoneValidationMsg = validatePhone(form.phone);
        if (phoneValidationMsg) {
            setPhoneError(phoneValidationMsg);
            return;
        }

        setIsLoading(true);
        setFormError(null);
        setPhoneError(null);
        setSuccessMsg(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await axios.post(
                '/submit-berkas/customers',
                {
                    company_name: form.companyName.trim(),
                    address: form.address.trim() || null,
                    phone: form.phone.trim() || null,
                    email: form.email.trim() || null,
                    pic_name: form.picName.trim() || null,
                },
                { signal: controller.signal }
            );

            const saved = response.data.customer;
            const newCustomer: Customer = {
                id: saved.id,
                companyName: saved.company_name || form.companyName.trim(),
                address: saved.address || form.address.trim(),
                phone: saved.phone || form.phone.trim(),
                email: saved.email || form.email.trim(),
                picName: saved.pic_name || form.picName.trim(),
            };

            // Munculkan toast notifikasi
            setSuccessMsg('Customer berhasil ditambahkan!');

            // Beri jeda 1.5 detik, lalu tutup modal
            setTimeout(() => {
                onCustomerCreated(newCustomer);
                resetForm();
                onClose();
                setIsLoading(false);
            }, 1500);

        } catch (err: unknown) {
            setIsLoading(false);
            if (axios.isCancel(err)) return;

            let msg = 'Gagal menambahkan customer baru. Silakan coba lagi.';

            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                const validationErrors = err.response?.data?.errors as Record<string, string[]>;

                const backendPhoneError = validationErrors?.phone?.[0];
                if (backendPhoneError) setPhoneError(backendPhoneError);

                const firstOtherFieldError = validationErrors
                    ? Object.entries(validationErrors).find(([field]) => field !== 'phone')?.[1]?.[0]
                    : undefined;

                if (!backendPhoneError || firstOtherFieldError) {
                    msg = firstOtherFieldError || err.response?.data?.message || msg;
                    setFormError(msg);
                }
                return;
            }
            setFormError(msg);
        } finally {
            abortControllerRef.current = null;
        }
    };

    const isFormDisabled = isLoading || successMsg !== null;

    return (
        <>
            {/* Animasi CSS agar notifikasi turun dari atas secara smooth */}
            <style>
                {`
                    @keyframes slideDown {
                        0% { top: 0px; opacity: 0; }
                        100% { top: 32px; opacity: 1; }
                    }
                `}
            </style>

            <div
                role="dialog"
                aria-modal="true"
                style={styles.overlay}
                onClick={isFormDisabled ? undefined : handleClose}
            >
                {/* 
                    Notifikasi Toast diletakkan di luar kontainer modal, 
                    tetapi di dalam overlay, sehingga posisinya mengambang independen.
                */}
                {successMsg && (
                    <div style={styles.toast}>
                        <CheckCircle2 size={20} strokeWidth={2.5} color="#FFFFFF" />
                        {successMsg}
                    </div>
                )}

                <div onClick={(e) => e.stopPropagation()} style={styles.modal}>
                    {/* Modal Header */}
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.iconWrap}>
                                <Building2 size={18} />
                            </div>
                            <div>
                                <h3 style={styles.title}>Tambah Customer Baru</h3>
                                <p style={styles.subtitle}>
                                    Masukkan detail perusahaan untuk penugasan pengiriman
                                </p>
                            </div>
                        </div>

                        <button type="button" onClick={handleClose} disabled={isFormDisabled} style={styles.closeButton}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form Input */}
                    <form onSubmit={handleCreateCustomer} style={styles.form}>
                        <div>
                            <label style={styles.label}>
                                Nama Perusahaan <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                disabled={isFormDisabled}
                                value={form.companyName}
                                onChange={(e) => handleFormChange('companyName', e.target.value)}
                                placeholder="Contoh: PT Sumber Logistik Bersama"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.grid2}>
                            <div>
                                <label style={styles.label}>Nama PIC</label>
                                <input
                                    type="text"
                                    disabled={isFormDisabled}
                                    value={form.picName}
                                    onChange={(e) => handleFormChange('picName', e.target.value)}
                                    placeholder="Nama penanggung jawab"
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>No. Telepon / WA</label>
                                <input
                                    type="text"
                                    disabled={isFormDisabled}
                                    value={form.phone}
                                    onChange={(e) => handleFormChange('phone', e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    style={phoneError ? { ...styles.input, ...styles.inputError } : styles.input}
                                />
                                {phoneError && <p style={styles.fieldError}>{phoneError}</p>}
                            </div>
                        </div>

                        <div>
                            <label style={styles.label}>Email Perusahaan</label>
                            <input
                                type="email"
                                disabled={isFormDisabled}
                                value={form.email}
                                onChange={(e) => handleFormChange('email', e.target.value)}
                                placeholder="admin@perusahaan.co.id"
                                style={styles.input}
                            />
                        </div>

                        <div>
                            <label style={styles.label}>Alamat Lengkap</label>
                            <textarea
                                rows={2}
                                disabled={isFormDisabled}
                                value={form.address}
                                onChange={(e) => handleFormChange('address', e.target.value)}
                                placeholder="Jl. Industri Raya Blok A No. 12, Jakarta"
                                style={styles.textarea}
                            />
                        </div>

                        {/* Notifikasi Error (tetap di dalam form) */}
                        {formError && <div style={styles.errorBox}>{formError}</div>}

                        {/* Footer Tombol Aksi */}
                        <div style={styles.footer}>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isFormDisabled}
                                style={styles.cancelButton(isFormDisabled)}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isFormDisabled}
                                style={styles.submitButton(isFormDisabled)}
                            >
                                <Plus size={15} />
                                {isLoading ? 'Menyimpan...' : successMsg ? 'Tersimpan!' : 'Simpan Customer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}