import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Search, Plus, Building2, ArrowLeft, Check } from 'lucide-react';
import type { Customer } from '../types/SubmitBerkas';

interface CustomerSelectModalProps {
    onConfirm: (customer: Customer) => void;
    customers?: Customer[];
}

type Mode = 'search' | 'create';

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

export default function CustomerSelectModal({ onConfirm, customers: propCustomers }: CustomerSelectModalProps) {
    const pageProps = usePage<{ customers?: any[] }>().props;

    // Evaluasi reaktif terhadap props yang masuk[cite: 3]
    const effectiveList = useMemo(() => {
        if (propCustomers && propCustomers.length > 0) return propCustomers;
        if (pageProps.customers && pageProps.customers.length > 0) return pageProps.customers;
        return [];
    }, [propCustomers, pageProps.customers]);

    const [mode, setMode] = useState<Mode>('search');
    const [query, setQuery] = useState('');
    const [customers, setCustomers] = useState<any[]>(effectiveList);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState<NewCustomerForm>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);

    // Sinkronkan state lokal saat effectiveList diperbarui[cite: 3]
    useEffect(() => {
        setCustomers(effectiveList);
    }, [effectiveList]);

    const filteredCustomers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c: any) => {
            const name = c.companyName || c.company_name || '';
            return name.toLowerCase().includes(q);
        });
    }, [customers, query]);

    const handleSelect = (rawCustomer: any) => {
        const normalizedCustomer: Customer = {
            id: rawCustomer.id,
            companyName: rawCustomer.companyName || rawCustomer.company_name || '',
            address: rawCustomer.address || '',
            phone: rawCustomer.phone || '',
            email: rawCustomer.email || '',
            picName: rawCustomer.picName || rawCustomer.pic_name || '',
        };
        onConfirm(normalizedCustomer);
    };

    const handleFormChange = (field: keyof NewCustomerForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateCustomer = async () => {
        if (!form.companyName.trim()) {
            setFormError('Nama perusahaan wajib diisi.');
            return;
        }

        try {
            setIsLoading(true);
            setFormError(null);

            // Ubah URL dari '/customers' menjadi '/submit-berkas/customers'
            const response = await axios.post('/submit-berkas/customers', {
                company_name: form.companyName.trim(),
                address: form.address.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                pic_name: form.picName.trim(),
            });

            const newCustomerData = response.data?.customer || response.data;
            const normalized: Customer = {
                id: newCustomerData.id,
                companyName: newCustomerData.companyName || newCustomerData.company_name || form.companyName,
                address: newCustomerData.address || form.address,
                phone: newCustomerData.phone || form.phone,
                email: newCustomerData.email || form.email,
                picName: newCustomerData.picName || newCustomerData.pic_name || form.picName,
            };

            setCustomers((prev) => [normalized, ...prev]);
            setForm(EMPTY_FORM);
            onConfirm(normalized);
        } catch (error: any) {
            console.error('Gagal membuat customer baru:', error);
            setFormError(
                error.response?.data?.message || 'Gagal menyimpan customer ke database.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div
                    className="flex items-center gap-3 rounded-t-2xl px-6 py-5"
                    style={{ backgroundColor: '#06283A' }}
                >
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: '#FFF4D6' }}
                    >
                        <Building2 size={20} style={{ color: '#B7791F' }} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Pilih Customer</h2>
                        <p className="text-xs text-gray-300">
                            Tentukan pemilik dokumen sebelum mulai mengisi berkas
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {mode === 'search' ? (
                        <>
                            {/* Search input */}
                            <div className="relative mb-4">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Cari nama perusahaan..."
                                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                    autoFocus
                                />
                            </div>

                            {/* Result list */}
                            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-gray-400">
                                        Customer tidak ditemukan.
                                    </p>
                                ) : (
                                    filteredCustomers.map((customer: any) => {
                                        const displayName = customer.companyName || customer.company_name || '-';
                                        const displayPic = customer.picName || customer.pic_name || '-';

                                        return (
                                            <button
                                                key={customer.id}
                                                type="button"
                                                onClick={() => handleSelect(customer)}
                                                className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-left transition-colors hover:border-yellow-300 hover:bg-yellow-50"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {displayName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{displayPic}</p>
                                                </div>
                                                <Check
                                                    size={16}
                                                    className="text-transparent transition-colors group-hover:text-yellow-500"
                                                />
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Add new customer trigger */}
                            <button
                                type="button"
                                onClick={() => setMode('create')}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-yellow-400 py-2.5 text-sm font-semibold transition-colors hover:bg-yellow-50"
                                style={{ color: '#B7791F' }}
                            >
                                <Plus size={16} />
                                Tambah Customer Baru
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Back to search */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('search');
                                    setFormError(null);
                                }}
                                className="mb-4 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft size={14} />
                                Kembali ke pencarian
                            </button>

                            {/* New customer form */}
                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        Nama Perusahaan
                                    </label>
                                    <input
                                        type="text"
                                        value={form.companyName}
                                        onChange={(e) => handleFormChange('companyName', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                        placeholder="PT Contoh Logistik Indonesia"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        Alamat
                                    </label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={(e) => handleFormChange('address', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                        placeholder="Jl. Contoh No. 1, Kota"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            No. Telepon
                                        </label>
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={(e) => handleFormChange('phone', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                            placeholder="021-xxxxxxx"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => handleFormChange('email', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                            placeholder="admin@perusahaan.co.id"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        Nama PIC
                                    </label>
                                    <input
                                        type="text"
                                        value={form.picName}
                                        onChange={(e) => handleFormChange('picName', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                        placeholder="Nama penanggung jawab"
                                    />
                                </div>

                                {formError && (
                                    <p className="text-xs font-medium text-red-500">{formError}</p>
                                )}

                                <button
                                    type="button"
                                    onClick={handleCreateCustomer}
                                    disabled={isLoading}
                                    className="mt-2 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#B7791F' }}
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan & Gunakan Customer Ini'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}