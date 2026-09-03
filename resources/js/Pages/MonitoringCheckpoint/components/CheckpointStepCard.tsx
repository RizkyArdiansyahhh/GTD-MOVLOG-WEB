import React, { useState } from "react";
import {
    User,
    Clock,
    FileText,
    Image as ImageIcon,
    ChevronDown,
    MapPin,
    Check,
    Ship,
    Anchor,
    Building2,
    Calendar,
} from "lucide-react";
import type { CheckpointStepView } from "../types/MonitoringCheckpoint";

interface CheckpointStepCardProps {
    step: CheckpointStepView;
    isLast: boolean;
}

/** Helper untuk memilih icon kontekstual berdasarkan nama step */
function getStepIcon(title: string) {
    const lower = title.toLowerCase();
    if (lower.includes("mv") || lower.includes("vessel") || lower.includes("kapal")) {
        return <Ship className="h-4 w-4" />;
    }
    if (lower.includes("tongkang") || lower.includes("barge")) {
        return <Anchor className="h-4 w-4" />;
    }
    if (lower.includes("pelabuhan") || lower.includes("port")) {
        return <Building2 className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
}

/**
 * 1 kartu step dalam vertical timeline CheckpointStepTimeline.
 */
export default function CheckpointStepCard({ step, isLast }: CheckpointStepCardProps) {
    const [expanded, setExpanded] = useState(false);

    const isPending = step.status === "pending";
    const isCompleted = step.status === "COMPLETED";
    const isInProgress = step.status === "IN_PROGRESS";

    const report = step.latestReport;
    const hasDetail = Boolean(report?.description) || Boolean(report?.photos.length);

    return (
        <div className="relative flex gap-4 pb-8 last:pb-2">
            {/* Konektor vertikal */}
            {!isLast && (
                <div
                    className="absolute left-3.5 top-8 bottom-0 w-0.5 -translate-x-1/2 transition-colors duration-300"
                    style={{
                        backgroundColor: isCompleted ? "#06283A" : isInProgress ? "#B7791F" : "#E2E8F0",
                    }}
                />
            )}

            {/* Node indikator status step */}
            <div className="relative z-10 flex-shrink-0 pt-0.5">
                {isCompleted ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06283A] text-white shadow-xs">
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                ) : isInProgress ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#B7791F] bg-amber-50 shadow-xs">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B7791F]" />
                        </span>
                    </div>
                ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-semibold text-slate-400">
                        {step.order}
                    </div>
                )}
            </div>

            {/* Kartu konten step */}
            <div
                className={`flex-1 rounded-2xl border p-5 shadow-xs transition-all ${
                    isInProgress
                        ? "border-amber-300/80 bg-amber-50/20"
                        : isPending
                        ? "border-slate-200/70 bg-slate-50/40 opacity-75"
                        : "border-slate-200/90 bg-white hover:border-slate-300"
                }`}
            >
                {/* Header Step Card */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                        <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                                isCompleted
                                    ? "bg-slate-100 text-[#06283A]"
                                    : isInProgress
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-400"
                            }`}
                        >
                            {getStepIcon(step.title)}
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                Step {step.order}
                            </span>
                            <h3
                                className={`text-base font-semibold ${
                                    isPending ? "text-slate-500" : "text-[#06283A]"
                                }`}
                            >
                                {step.title}
                            </h3>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                        {isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                Selesai
                            </span>
                        )}
                        {isInProgress && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                                Sedang Berlangsung
                            </span>
                        )}
                        {isPending && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                                Belum Tercapai
                            </span>
                        )}
                    </div>
                </div>

                {/* Metadata PIC & Waktu */}
                {!isPending && (
                    <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                        {/* PIC Field Officer */}
                        <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <User className="h-3 w-3" />
                            </div>
                            <span className="text-slate-400">PIC:</span>
                            <span className="font-medium text-slate-700">{step.picName ?? "-"}</span>
                        </div>

                        {/* Waktu Pelaksanaan */}
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-400">Waktu:</span>
                            <span className="font-medium text-slate-700">
                                {step.actualStart
                                    ? new Date(step.actualStart).toLocaleString("id-ID", {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                      })
                                    : "-"}
                                {step.actualFinish && (
                                    <>
                                        {" "}
                                        &rarr;{" "}
                                        {new Date(step.actualFinish).toLocaleString("id-ID", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                )}

                {/* Expandable Report Detail & Dokumentasi Foto */}
                {!isPending && hasDetail && report && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={() => setExpanded((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#B7791F] transition hover:bg-amber-50"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            <span>
                                {expanded ? "Sembunyikan detail progress" : "Lihat laporan & dokumentasi"}
                            </span>
                            {report.photos.length > 0 && (
                                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                                    {report.photos.length} foto
                                </span>
                            )}
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                    expanded ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {expanded && (
                            <div className="mt-3 space-y-3">
                                {/* Catatan / Deskripsi Lapangan */}
                                {report.description && (
                                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                            Catatan Lapangan
                                        </p>
                                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                                            {report.description}
                                        </p>
                                    </div>
                                )}

                                {/* Galeri Foto Dokumentasi */}
                                {report.photos.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                            Foto Dokumentasi Lapangan
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {report.photos.map((photo) => (
                                                <a
                                                    key={photo.id}
                                                    href={photo.photoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs"
                                                >
                                                    <img
                                                        src={photo.photoUrl}
                                                        alt={photo.caption ?? step.title}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    {photo.isCover && (
                                                        <span className="absolute left-2 top-2 rounded-md bg-[#06283A]/80 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                                            Cover
                                                        </span>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center">
                                                        <div className="rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                            <ImageIcon className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}