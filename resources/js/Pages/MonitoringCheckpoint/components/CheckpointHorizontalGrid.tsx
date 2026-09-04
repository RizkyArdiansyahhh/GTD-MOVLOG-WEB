import React, { useState } from "react";
import {
    Ship,
    Anchor,
    Building2,
    MapPin,
    Check,
    Clock,
    User,
    FileText,
    Image as ImageIcon,
    ChevronDown,
    X,
} from "lucide-react";
import type { CheckpointStepView } from "../types/MonitoringCheckpoint";

interface CheckpointHorizontalGridProps {
    steps: CheckpointStepView[];
    currentCheckpointId: number | null;
}

function getStepIcon(title: string) {
    const lower = title.toLowerCase();
    if (lower.includes("mv") || lower.includes("vessel") || lower.includes("kapal")) {
        return <Ship className="h-5 w-5" />;
    }
    if (lower.includes("tongkang") || lower.includes("barge")) {
        return <Anchor className="h-5 w-5" />;
    }
    if (lower.includes("pelabuhan") || lower.includes("port")) {
        return <Building2 className="h-5 w-5" />;
    }
    return <MapPin className="h-5 w-5" />;
}

export default function CheckpointHorizontalGrid({
    steps,
    currentCheckpointId,
}: CheckpointHorizontalGridProps) {
    const [activePhotoModal, setActivePhotoModal] = useState<{
        url: string;
        caption?: string;
        title: string;
    } | null>(null);

    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({
        1: true,
        2: true,
        3: true,
        4: true,
    });

    const toggleExpand = (checkpointId: number) => {
        setExpandedCards((prev) => ({
            ...prev,
            [checkpointId]: !prev[checkpointId],
        }));
    };

    const completedCount = steps.filter((s) => {
        const raw = (s.status ?? "").toLowerCase();
        return raw === "completed" || raw === "selesai";
    }).length;

    const progressPercentage = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Horizontal Stepper Connector Bar */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-base font-bold text-[#06283A]">
                            Alur Perjalanan Checkpoint
                        </h2>
                        <p className="text-xs text-slate-500">
                            Pelacakan perpindahan kargo dari titik muat awal hingga titik bongkar akhir
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progressPercentage}%`,
                                        backgroundColor: progressPercentage >= 100 ? "#16A34A" : "#B7791F",
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{progressPercentage}%</span>
                        </div>

                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                completedCount === steps.length && steps.length > 0
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border border-amber-200 bg-amber-50 text-amber-900"
                            }`}
                        >
                            {completedCount} dari {steps.length} Tahap Selesai
                        </span>
                    </div>
                </div>

                {/* Horizontal Stepper Nodes */}
                <div className="relative">
                    {/* Background Progress Line */}
                    <div className="absolute top-5 left-8 right-8 hidden h-1 -translate-y-1/2 bg-slate-100 md:block z-0" />
                    
                    {/* Active Fill Line */}
                    <div
                        className="absolute top-5 left-8 hidden h-1 -translate-y-1/2 bg-[#06283A] md:block transition-all duration-500 z-0"
                        style={{
                            width: steps.length > 1 ? `${(completedCount / (steps.length - 1)) * 82}%` : "0%",
                            maxWidth: "calc(100% - 4rem)",
                        }}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-3 relative z-10">
                        {steps.map((step, idx) => {
                            const rawStatus = (step.status ?? "pending").toLowerCase();
                            const isCompleted = rawStatus === "completed" || rawStatus === "selesai";
                            const isInProgress = rawStatus === "in_progress" || rawStatus === "aktif";
                            const isPending = !isCompleted && !isInProgress;

                            return (
                                <div
                                    key={step.checkpointId}
                                    className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
                                        isInProgress
                                            ? "border-amber-300 bg-amber-50/40 shadow-xs ring-2 ring-amber-400/20"
                                            : isCompleted
                                            ? "border-slate-200/90 bg-white shadow-xs"
                                            : "border-slate-200/70 bg-slate-50/50 opacity-70"
                                    }`}
                                >
                                    {/* Number / Status Circle Node */}
                                    <div className="mb-3">
                                        {isCompleted ? (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#06283A] text-white shadow-xs">
                                                <Check className="h-5 w-5" strokeWidth={2.5} />
                                            </div>
                                        ) : isInProgress ? (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#B7791F] bg-amber-50 text-[#B7791F] shadow-xs">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#B7791F]" />
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-400">
                                                {idx + 1}
                                            </div>
                                        )}
                                    </div>

                                    {/* Title & Stage */}
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Tahap {step.order}
                                    </span>
                                    <h3 className="text-sm font-bold text-[#06283A] mt-0.5">
                                        {step.title}
                                    </h3>

                                    {/* Status Badge */}
                                    <div className="mt-2.5">
                                        {isCompleted && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                <Check className="h-3 w-3" /> Selesai
                                            </span>
                                        )}
                                        {isInProgress && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                                                Sedang Berjalan
                                            </span>
                                        )}
                                        {isPending && (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                                                Belum Dimulai
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Horizontal 4-Column Step Cards (Expanded Details) */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((step) => {
                    const rawStatus = (step.status ?? "pending").toLowerCase();
                    const isCompleted = rawStatus === "completed" || rawStatus === "selesai";
                    const isInProgress = rawStatus === "in_progress" || rawStatus === "aktif";
                    const isPending = !isCompleted && !isInProgress;

                    const report = step.latestReport;
                    const isExpanded = expandedCards[step.checkpointId] ?? false;

                    return (
                        <div
                            key={step.checkpointId}
                            className={`flex flex-col rounded-2xl border bg-white shadow-xs transition-all ${
                                isInProgress
                                    ? "border-amber-300 ring-1 ring-amber-300/40"
                                    : isCompleted
                                    ? "border-slate-200/90 hover:border-slate-300"
                                    : "border-slate-200/70 bg-slate-50/40 opacity-80"
                            }`}
                        >
                            {/* Card Header */}
                            <div className="p-5 border-b border-slate-100">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                isCompleted
                                                    ? "bg-[#06283A] text-white"
                                                    : isInProgress
                                                    ? "bg-amber-100 text-amber-900"
                                                    : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            {getStepIcon(step.title)}
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                Step {step.order}
                                            </span>
                                            <h4 className="text-base font-bold text-[#06283A] leading-tight">
                                                {step.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <div>
                                        {isCompleted ? (
                                            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                Selesai
                                            </span>
                                        ) : isInProgress ? (
                                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* PIC & Waktu Info */}
                                <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                                    <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            <span>PIC Petugas:</span>
                                        </div>
                                        <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                                            {step.picName ?? "-"}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span>Jadwal / Waktu:</span>
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-700 pl-5">
                                            {step.actualStart ? (
                                                <>
                                                    <div>
                                                        {new Date(step.actualStart).toLocaleString("id-ID", {
                                                            dateStyle: "medium",
                                                            timeStyle: "short",
                                                        })}
                                                    </div>
                                                    {step.actualFinish && (
                                                        <div className="text-slate-500">
                                                            &darr;{" "}
                                                            {new Date(step.actualFinish).toLocaleString("id-ID", {
                                                                dateStyle: "medium",
                                                                timeStyle: "short",
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-400">Belum ada catatan waktu</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body - Report & Photos */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                {report ? (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(step.checkpointId)}
                                            className="w-full flex items-center justify-between text-xs font-bold text-[#B7791F] hover:text-[#975A16] transition-colors p-1"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5" />
                                                Laporan Lapangan
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {report.photos.length > 0 && (
                                                    <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                                                        {report.photos.length} foto
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                                        isExpanded ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="space-y-3 pt-1">
                                                {/* Catatan Deskripsi */}
                                                {report.description && (
                                                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                                            Catatan Operasional
                                                        </p>
                                                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-4 hover:line-clamp-none">
                                                            {report.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Galeri Foto */}
                                                {report.photos.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                            Foto Dokumentasi
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {report.photos.map((photo) => (
                                                                <button
                                                                    key={photo.id}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setActivePhotoModal({
                                                                            url: photo.photoUrl,
                                                                            caption: photo.caption,
                                                                            title: `${step.title} - Step ${step.order}`,
                                                                        })
                                                                    }
                                                                    className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs hover:border-slate-400 transition"
                                                                >
                                                                    <img
                                                                        src={photo.photoUrl}
                                                                        alt={photo.caption ?? step.title}
                                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30 flex items-center justify-center">
                                                                        <div className="rounded-lg bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <ImageIcon className="h-3.5 w-3.5" />
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-xs text-slate-400">
                                        <p>Belum ada laporan lapangan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Photo Lightbox Modal */}
            {activePhotoModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn"
                    onClick={() => setActivePhotoModal(null)}
                >
                    <div
                        className="relative max-w-2xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                            <h4 className="text-sm font-bold text-[#06283A]">
                                {activePhotoModal.title}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setActivePhotoModal(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
                            <img
                                src={activePhotoModal.url}
                                alt={activePhotoModal.caption ?? "Foto Dokumentasi"}
                                className="max-h-[65vh] w-auto object-contain rounded-lg"
                            />
                        </div>

                        {activePhotoModal.caption && (
                            <div className="p-4 bg-white border-t border-slate-100">
                                <p className="text-xs text-slate-600 font-medium">
                                    {activePhotoModal.caption}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
