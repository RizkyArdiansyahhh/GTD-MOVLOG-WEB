import React, { useState } from "react";
import { User, Clock, FileText, Image as ImageIcon, ChevronDown, MapPin } from "lucide-react";
import type { CheckpointStepView } from "../types/MonitoringCheckpoint";

interface CheckpointStepCardProps {
    step: CheckpointStepView;
    isLast: boolean;
}

/**
 * 1 kartu step dalam vertical timeline (CheckpointStepTimeline).
 * Menampilkan: judul step (sekaligus berfungsi sebagai "lokasi", sesuai
 * keputusan produk: tidak ada kolom location terpisah), PIC, waktu mulai/selesai.
 * Detail tambahan (report terbaru: note + foto) di-expand via toggle.
 *
 * Sumber data per field:
 * - title       -> checkpoints.name
 * - picName     -> session_checkpoints.pic_user_id -> users.name
 * - actualStart / actualFinish -> session_checkpoints
 * - latestReport -> report TERBARU (event_at desc) milik session_checkpoint ini
 *
 * Visual status:
 * - COMPLETED   : ikon terisi warna gold (#B7791F), teks & konektor solid
 * - IN_PROGRESS : ikon outline gold, teks solid
 * - pending     : ikon & teks abu-abu (dimmed) -- artinya session_checkpoint
 *                 belum tercipta sama sekali untuk shipment ini
 */
export default function CheckpointStepCard({ step, isLast }: CheckpointStepCardProps) {
    const [expanded, setExpanded] = useState(false);

    const isPending = step.status === "pending";
    const isCompleted = step.status === "COMPLETED";
    const report = step.latestReport;
    const hasDetail = Boolean(report?.description) || Boolean(report?.photos.length);

    const dotColor = isPending ? "#CBD5E1" : "#B7791F";
    const textColor = isPending ? "#94A3B8" : "#06283A";

    return (
        <div className="relative flex gap-4 pb-8 last:pb-0">
            {/* Konektor vertikal */}
            {!isLast && (
                <div
                    className="absolute left-[11px] top-6 h-full w-0.5"
                    style={{ backgroundColor: isCompleted ? "#B7791F" : "#E2E8F0" }}
                />
            )}

            {/* Dot indikator step */}
            <div
                className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white"
                style={{ borderColor: dotColor }}
            >
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: isPending ? "transparent" : dotColor }} />
            </div>

            {/* Konten step */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4" style={{ opacity: isPending ? 0.6 : 1 }}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Step {step.order}</p>
                            <h3 className="text-base font-semibold" style={{ color: textColor }}>
                                {step.title}
                            </h3>
                        </div>
                    </div>
                    {isPending && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            Pending
                        </span>
                    )}
                </div>

                {!isPending && (
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{step.picName ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>
                                {step.actualStart
                                    ? new Date(step.actualStart).toLocaleString("en-US", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })
                                    : "-"}
                                {step.actualFinish && (
                                    <>
                                        {" "}
                                        &rarr;{" "}
                                        {new Date(step.actualFinish).toLocaleString("en-US", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                )}

                {!isPending && hasDetail && report && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                        <button
                            onClick={() => setExpanded((prev) => !prev)}
                            className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: "#B7791F" }}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            View progress details
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                            />
                        </button>

                        {expanded && (
                            <div className="mt-3 space-y-3">
                                {report.description && (
                                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{report.description}</p>
                                )}

                                {report.photos.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {report.photos.map((photo) => (
                                            <a
                                                key={photo.id}
                                                href={photo.photoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200"
                                            >
                                                <img
                                                    src={photo.photoUrl}
                                                    alt={photo.caption ?? step.title}
                                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                                />
                                                <div className="absolute bottom-1 right-1 rounded bg-black/50 p-1">
                                                    <ImageIcon className="h-3 w-3 text-white" />
                                                </div>
                                            </a>
                                        ))}
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