import React, { useState, useEffect, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Download,
    X,
} from "lucide-react";
import type { CheckpointStepView, CheckpointLatestReport, CheckpointReportPhoto } from "../types/MonitoringCheckpoint";

interface CheckpointSelectedDetailProps {
    step: CheckpointStepView;
    totalSteps: number;
    onPrevStep: () => void;
    onNextStep: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}

/* ─────────────────────────────── helpers ── */

function statusLabel(raw: string): string {
    const s = raw.toLowerCase();
    if (s === "completed" || s === "selesai") return "Selesai";
    if (s === "in_progress" || s === "aktif") return "Berlangsung";
    return "Menunggu";
}

function statusVariant(raw: string): "done" | "active" | "idle" {
    const s = raw.toLowerCase();
    if (s === "completed" || s === "selesai") return "done";
    if (s === "in_progress" || s === "aktif") return "active";
    return "idle";
}

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* ─────────────────────────────── status pill ── */

function StatusPill({ raw }: { raw: string }) {
    const v = statusVariant(raw);
    const label = statusLabel(raw);
    const cls =
        v === "done"
            ? "bg-slate-100 text-[#06283A] border border-slate-200"
            : v === "active"
            ? "bg-amber-50 text-amber-800 border border-amber-200"
            : "bg-slate-50 text-slate-400 border border-slate-200";
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${v === "done" ? "bg-[#06283A]" : v === "active" ? "bg-amber-500" : "bg-slate-300"}`} />
            {label}
        </span>
    );
}

/* ─────────────────── armada accordion panel content ── */

interface ArmadaPanelProps {
    step: CheckpointStepView;
    report: CheckpointLatestReport | null;
    photos: CheckpointReportPhoto[];
    onOpenLightbox: (url: string, caption?: string) => void;
}

function ArmadaPanel({ step, report, photos, onOpenLightbox }: ArmadaPanelProps) {
    const snapshot = step.templateSnapshot;
    const templateName = snapshot?.template_name;
    const requiredFields = (snapshot?.fields ?? []) as Array<{
        key: string; label: string; required: boolean; field_type?: string;
    }>;
    const formValues = report?.formValues ?? [];
    const formValuesMap = new Map(formValues.map((fv) => [fv.fieldKey, fv.value]));

    // Fields list from template snapshot, or fallback to whatever form values exist
    const fieldsToDisplay = requiredFields.length > 0
        ? requiredFields
        : formValues.map((fv) => ({
              key: fv.fieldKey,
              label: fv.label,
              required: false,
              field_type: fv.fieldType,
          }));

    const photoSlots = (snapshot?.photo_slots ?? []) as Array<{
        key: string; label: string; required?: boolean;
    }>;

    const hasAnyData = fieldsToDisplay.length > 0 || photos.length > 0 || Boolean(report);

    return (
        <div className="divide-y divide-slate-100">
            {/* ── Template Banner (jika ada) ── */}
            {templateName && (
                <div className="bg-slate-50/70 px-5 py-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">Form Template:</span>
                    <span className="font-medium text-[#06283A]">{templateName}</span>
                </div>
            )}

            {/* ── Data Laporan Spesifik Per Step ── */}
            {fieldsToDisplay.length > 0 && (
                <div className="px-5 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Data Isian Lapangan ({fieldsToDisplay.length} Field)
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                        {fieldsToDisplay.map((field) => {
                            const value = formValuesMap.get(field.key);
                            const isFilled = Boolean(value);
                            return (
                                <div
                                    key={field.key}
                                    className={`rounded-xl border p-3 transition-colors ${
                                        isFilled
                                            ? "border-slate-200 bg-white"
                                            : "border-dashed border-slate-200 bg-slate-50/50"
                                    }`}
                                >
                                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                        {field.label}
                                    </span>
                                    <span
                                        className={`mt-1 block text-sm font-semibold ${
                                            isFilled ? "text-[#06283A]" : "text-slate-300 italic"
                                        }`}
                                    >
                                        {value || "Belum diisi"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Foto Dokumentasi Spesifik Per Step ── */}
            {photos.length > 0 ? (
                <div className="px-5 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Foto Dokumentasi ({photos.length})
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {photos.map((photo, idx) => {
                            const slot = photoSlots[idx];
                            const caption = photo.caption || slot?.label || `Foto ${idx + 1}`;
                            return (
                                <div
                                    key={photo.id}
                                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition"
                                >
                                    <button
                                        type="button"
                                        onClick={() => onOpenLightbox(photo.photoUrl, caption)}
                                        className="relative aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer"
                                    >
                                        <img
                                            src={photo.photoUrl}
                                            alt={caption}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <p className="truncate text-[10px] font-semibold text-white">
                                                Klik untuk perbesar
                                            </p>
                                        </div>
                                    </button>
                                    <div className="p-2 border-t border-slate-100 bg-slate-50/60">
                                        <p className="line-clamp-2 text-[11px] font-medium text-slate-700 leading-tight">
                                            {caption}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : photoSlots.length > 0 ? (
                <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Slot Foto Dokumentasi ({photoSlots.length} Wajib)
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {photoSlots.map((slot) => (
                            <div
                                key={slot.key}
                                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-400"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                                <span className="truncate">{slot.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Belum ada laporan sama sekali */}
            {!hasAnyData && (
                <div className="px-5 py-8 text-center">
                    <p className="text-sm text-slate-300 italic">Belum ada laporan yang dikirim untuk tahap ini.</p>
                </div>
            )}

            {/* PIC + catatan */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Penanggung Jawab
                    </p>
                    {step.picName ? (
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#06283A] text-xs font-bold text-white">
                                {step.picName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#06283A]">{step.picName}</p>
                                <p className="text-[11px] text-slate-400">Field Worker</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs italic text-slate-300">Belum ditugaskan</p>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400">Mulai</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{fmtDate(step.actualStart)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400">Selesai</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{fmtDate(step.actualFinish)}</p>
                        </div>
                    </div>
                </div>
                <div className="px-5 py-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Catatan Lapangan
                    </p>
                    {report?.description ? (
                        <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                            {report.description}
                        </p>
                    ) : (
                        <p className="text-xs italic text-slate-300">Belum ada catatan.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────── armada accordion item ── */

interface ArmadaAccordionItemProps {
    label: string;
    statusRaw: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function ArmadaAccordionItem({ label, statusRaw, isOpen, onToggle, children }: ArmadaAccordionItemProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className={`overflow-hidden rounded-xl border transition-colors ${
                isOpen
                    ? "border-[#06283A]/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
            } bg-white`}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer"
            >
                <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
                <StatusPill raw={statusRaw} />
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            <div
                ref={contentRef}
                style={{
                    maxHeight: isOpen
                        ? contentRef.current
                            ? contentRef.current.scrollHeight + "px"
                            : "9999px"
                        : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.28s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                <div className="border-t border-slate-100">{children}</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────── main component ── */

export default function CheckpointSelectedDetail({
    step,
    totalSteps,
    onPrevStep,
    onNextStep,
    hasPrev,
    hasNext,
}: CheckpointSelectedDetailProps) {
    const movements = step.movements ?? [];

    // Untuk single-armada: tampilkan langsung tanpa accordion
    // Untuk multi-armada: buka armada pertama by default
    const [openMovementId, setOpenMovementId] = useState<string | null>(
        movements[0]?.id ?? null
    );

    // Reset saat step berganti
    useEffect(() => {
        setOpenMovementId(movements[0]?.id ?? null);
    }, [step.checkpointId]);

    const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);

    const handleDownload = async (url: string, caption?: string) => {
        try {
            const blob = await (await fetch(url)).blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${(caption ?? "foto").toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, "_blank");
        }
    };

    const rawStatus = (step.status ?? "pending").toLowerCase();
    const isCompleted = rawStatus === "completed" || rawStatus === "selesai";
    const isInProgress = rawStatus === "in_progress" || rawStatus === "aktif";

    // Ketika tidak ada movements → gunakan latestReport langsung
    const noMovements = movements.length === 0;
    const fallbackReport = step.latestReport;
    const fallbackPhotos = fallbackReport?.photos ?? [];

    return (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            {/* ── Step header ── */}
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Tahap {step.order} dari {totalSteps}
                        </span>
                        {isCompleted ? (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#06283A] border border-slate-200">
                                Selesai
                            </span>
                        ) : isInProgress ? (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                Berlangsung
                            </span>
                        ) : (
                            <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200">
                                Menunggu
                            </span>
                        )}
                    </div>
                    <h2 className="text-base font-bold text-[#06283A] leading-tight">{step.title}</h2>
                </div>

                {/* Prev / Next */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        disabled={!hasPrev}
                        onClick={onPrevStep}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            hasPrev
                                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                                : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Sebelumnya
                    </button>
                    <button
                        type="button"
                        disabled={!hasNext}
                        onClick={onNextStep}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            hasNext
                                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                                : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                    >
                        Berikutnya
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="p-5 space-y-4">

                {/* Case A: multi-armada → accordion per armada */}
                {movements.length > 1 && (
                    <>
                        <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Armada ({movements.length})
                            </p>
                            <div className="space-y-2">
                                {movements.map((m) => {
                                    const isOpen = openMovementId === m.id;
                                    const mReport = m.report;
                                    const mPhotos = mReport?.photos ?? [];

                                    return (
                                        <ArmadaAccordionItem
                                            key={m.id}
                                            label={m.name}
                                            statusRaw={m.status}
                                            isOpen={isOpen}
                                            onToggle={() =>
                                                setOpenMovementId(isOpen ? null : m.id)
                                            }
                                        >
                                            <ArmadaPanel
                                                step={step}
                                                report={mReport}
                                                photos={mPhotos}
                                                onOpenLightbox={(url, caption) =>
                                                    setLightbox({ url, caption })
                                                }
                                            />
                                        </ArmadaAccordionItem>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Case B: single armada → tampil langsung tanpa accordion wrapper */}
                {movements.length === 1 && (
                    <ArmadaPanel
                        step={step}
                        report={movements[0].report}
                        photos={movements[0].report?.photos ?? []}
                        onOpenLightbox={(url, caption) => setLightbox({ url, caption })}
                    />
                )}

                {/* Case C: tidak ada movement → pakai latestReport langsung */}
                {noMovements && (
                    <ArmadaPanel
                        step={step}
                        report={fallbackReport}
                        photos={fallbackPhotos}
                        onOpenLightbox={(url, caption) => setLightbox({ url, caption })}
                    />
                )}
            </div>

            {/* ── Lightbox modal ── */}
            {lightbox && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                            <p className="text-sm font-semibold text-[#06283A]">
                                {lightbox.caption ?? "Foto Dokumentasi"}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownload(lightbox.url, lightbox.caption)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Unduh
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLightbox(null)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex max-h-[65vh] items-center justify-center bg-slate-950 p-3">
                            <img
                                src={lightbox.url}
                                alt={lightbox.caption ?? "Foto"}
                                className="max-h-[62vh] w-auto object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
