import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { MasterTemplateItem, CheckpointOption } from './types';

interface IndexProps {
    templates: MasterTemplateItem[];
    checkpoints: CheckpointOption[];
}

export default function TemplateLaporanIndex({ templates = [], checkpoints = [] }: IndexProps) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('all');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filteredTemplates = selectedCheckpoint === 'all'
        ? templates
        : templates.filter((t) => String(t.checkpoint_id) === selectedCheckpoint);

    const handleDelete = (template: MasterTemplateItem) => {
        if (!confirm(`Hapus template '${template.name}'? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        setDeletingId(template.id);
        router.delete(`/template-laporan/${template.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Report Templates - GTD Logistics" />

            <div className="w-full max-w-7xl mx-auto space-y-4">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                        <h1 className="text-base font-bold text-[#06283A]">
                            Report Templates
                        </h1>
                        <p className="text-xs text-slate-500">
                            Konfigurasi formulir dan slot foto bukti untuk setiap tahapan pengiriman
                        </p>
                    </div>

                    <Link
                        href="/template-laporan/create"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#06283A] bg-[#F5B800] hover:bg-[#E5AC00] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
                    >
                        <Plus size={13} />
                        Add Template
                    </Link>
                </div>

                {/* ── Flash Messages ── */}
                {flash?.success && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
                        <AlertCircle size={14} className="shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* ── Subtle Filter Tabs ── */}
                <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => setSelectedCheckpoint('all')}
                        className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                            selectedCheckpoint === 'all'
                                ? 'border-[#06283A] text-[#06283A]'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        All Stages ({templates.length})
                    </button>
                    {checkpoints.map((cp) => {
                        const count = templates.filter((t) => t.checkpoint_id === cp.id).length;
                        return (
                            <button
                                key={cp.id}
                                type="button"
                                onClick={() => setSelectedCheckpoint(String(cp.id))}
                                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                                    selectedCheckpoint === String(cp.id)
                                        ? 'border-[#06283A] text-[#06283A]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Stage {cp.sequence}: {cp.name} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* ── Clean Minimalist Table View ── */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    {filteredTemplates.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                                        <th className="py-2.5 px-4">Template Name</th>
                                        <th className="py-2.5 px-4">Stage</th>
                                        <th className="py-2.5 px-4">Form & Photos</th>
                                        <th className="py-2.5 px-4">Status</th>
                                        <th className="py-2.5 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTemplates.map((tpl) => (
                                        <tr key={tpl.id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Template Name & SOP Description */}
                                            <td className="py-3 px-4 max-w-sm">
                                                <div className="font-bold text-[#06283A]">
                                                    {tpl.name}
                                                </div>
                                                {tpl.description ? (
                                                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                                        {tpl.description}
                                                    </div>
                                                ) : null}
                                            </td>

                                            {/* Stage */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                                                    Stage {tpl.checkpoint_sequence}: {tpl.checkpoint_name}
                                                </span>
                                            </td>

                                            {/* Fields & Photos */}
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                                <span className="font-medium text-[#06283A]">{tpl.fields_count}</span> fields
                                                <span className="text-slate-300 mx-1.5">&bull;</span>
                                                <span className="font-medium text-[#06283A]">{tpl.photo_slots_count}</span> photos
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {tpl.is_used ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                        In Use
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        Draft
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-3 text-xs">
                                                    <Link
                                                        href={`/template-laporan/${tpl.id}/edit`}
                                                        className="font-semibold text-[#06283A] hover:underline"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(tpl)}
                                                        disabled={deletingId === tpl.id}
                                                        className="text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {deletingId === tpl.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No report templates found for the selected stage.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
