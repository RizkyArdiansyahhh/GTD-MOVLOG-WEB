import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Camera, Type } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { CheckpointOption, TemplateFieldItem } from './types';

interface CreateProps {
    checkpoints: CheckpointOption[];
}

export default function TemplateLaporanCreate({ checkpoints = [] }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        checkpoint_id: number | '';
        name: string;
        description: string;
        applies_to_report_type: string;
        fields: TemplateFieldItem[];
    }>({
        checkpoint_id: checkpoints[0]?.id ?? '',
        name: '',
        description: '',
        applies_to_report_type: 'movement',
        fields: [
            {
                field_name: 'Kondisi Muatan',
                field_key: 'kondisi_muatan',
                label: 'Kondisi Muatan',
                field_type: 'text',
                required: true,
                options: null,
                sort_order: 1,
            },
            {
                field_name: 'Foto Bukti Operasional',
                field_key: 'foto_bukti_operasional',
                label: 'Foto Bukti Operasional',
                field_type: 'photo',
                required: true,
                options: null,
                sort_order: 2,
            },
        ],
    });

    const addField = (type: 'text' | 'photo') => {
        const nextOrder = data.fields.length + 1;
        const newField: TemplateFieldItem = {
            field_name: type === 'photo' ? `Foto Bukti ${nextOrder}` : `Field ${nextOrder}`,
            field_key: '',
            label: '',
            field_type: type,
            required: true,
            options: null,
            sort_order: nextOrder,
        };

        setData('fields', [...data.fields, newField]);
    };

    const updateField = (index: number, key: keyof TemplateFieldItem, value: any) => {
        const updated = [...data.fields];
        updated[index] = { ...updated[index], [key]: value };
        setData('fields', updated);
    };

    const removeField = (index: number) => {
        if (data.fields.length <= 1) {
            alert('Minimal 1 field atau foto wajib dipertahankan.');
            return;
        }
        const updated = data.fields.filter((_, idx) => idx !== index);
        // reassign sort orders
        const reordered = updated.map((f, idx) => ({ ...f, sort_order: idx + 1 }));
        setData('fields', reordered);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/template-laporan');
    };

    return (
        <DashboardLayout>
            <Head title="Tambah Template Laporan - GTD Logistics" />

            <div className="w-full max-w-4xl mx-auto space-y-4">
                {/* ── Top Bar ── */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <Link
                        href="/template-laporan"
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#06283A] hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-[#06283A]">
                            Tambah Template Laporan
                        </h1>
                        <p className="text-xs text-slate-500">
                            Definisikan kebutuhan form dan foto bukti untuk tahapan pengiriman
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ── Basic Info Card ── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                        <h2 className="text-xs font-bold text-[#06283A] uppercase tracking-wide pb-2 border-b border-slate-100">
                            Informasi Master Template
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-[#06283A] mb-1">
                                    Tahapan Checkpoint <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.checkpoint_id}
                                    onChange={(e) => setData('checkpoint_id', Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-[#06283A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#06283A]"
                                >
                                    {checkpoints.map((cp) => (
                                        <option key={cp.id} value={cp.id}>
                                            Tahap {cp.sequence}: {cp.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.checkpoint_id && (
                                    <p className="text-[11px] text-rose-500 mt-1">{errors.checkpoint_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#06283A] mb-1">
                                    Nama Template Laporan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Laporan Ship-to-Ship Standard"
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-[#06283A] focus:outline-hidden focus:ring-1 focus:ring-[#06283A]"
                                />
                                {errors.name && (
                                    <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#06283A] mb-1">
                                Deskripsi Prosedur (Opsional)
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                placeholder="Jelaskan SOP pengisian laporan ini..."
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-[#06283A] focus:outline-hidden focus:ring-1 focus:ring-[#06283A]"
                            />
                        </div>
                    </div>

                    {/* ── Dynamic Fields & Photo Slots Builder ── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h2 className="text-xs font-bold text-[#06283A] uppercase tracking-wide">
                                    Definisi Form Field & Slot Foto ({data.fields.length})
                                </h2>
                                <p className="text-[11px] text-slate-500">
                                    Item yang wajib diisi oleh petugas lapangan saat melapor
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => addField('text')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#06283A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Type size={12} />
                                    + Form Field
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addField('photo')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#06283A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Camera size={12} />
                                    + Slot Foto
                                </button>
                            </div>
                        </div>

                        {errors.fields && (
                            <p className="text-[11px] text-rose-500">{errors.fields}</p>
                        )}

                        <div className="space-y-2.5">
                            {data.fields.map((field, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-bold text-[#06283A]">
                                            #{idx + 1} {field.field_type === 'photo' ? 'Slot Foto' : 'Field Data'}
                                        </span>

                                        <div className="flex items-center gap-3">
                                            <label className="inline-flex items-center gap-1 text-xs text-[#06283A] font-semibold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                                                    className="rounded border-slate-300 text-[#06283A] focus:ring-0"
                                                />
                                                <span>Wajib Diisi (Required)</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => removeField(idx)}
                                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                                title="Hapus field"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                        <div className="sm:col-span-6">
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                                Nama Field / Judul Foto
                                            </label>
                                            <input
                                                type="text"
                                                value={field.field_name}
                                                onChange={(e) => updateField(idx, 'field_name', e.target.value)}
                                                placeholder="Contoh: Kondisi Muatan"
                                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-[#06283A]"
                                            />
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                                Tipe Input
                                            </label>
                                            <select
                                                value={field.field_type}
                                                onChange={(e) => updateField(idx, 'field_type', e.target.value)}
                                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-[#06283A]"
                                            >
                                                <option value="text">Text (Teks Singkat)</option>
                                                <option value="number">Number (Angka / Satuan)</option>
                                                <option value="dropdown">Dropdown (Pilihan)</option>
                                                <option value="date">Date (Tanggal & Waktu)</option>
                                                <option value="photo">Foto (Lampiran Gambar)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {field.field_type === 'dropdown' && (
                                        <div className="pt-1">
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                                Pilihan Dropdown (pisahkan dengan koma)
                                            </label>
                                            <input
                                                type="text"
                                                value={field.options ? field.options.join(', ') : ''}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const parsed = raw.split(',').map((s) => s.trim()).filter(Boolean);
                                                    updateField(idx, 'options', parsed);
                                                }}
                                                placeholder="Contoh: CLEARED, IN_PROGRESS, PENDING, REJECTED"
                                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-[#06283A]"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Submit Button ── */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Link
                            href="/template-laporan"
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-[#06283A] bg-[#F5B800] hover:bg-[#E5AC00] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Master Template'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
