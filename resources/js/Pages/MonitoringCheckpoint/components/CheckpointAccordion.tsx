import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Download, X } from "lucide-react";
import type { CheckpointStepView, CheckpointLatestReport, CheckpointReportPhoto } from "../types/MonitoringCheckpoint";

interface CheckpointAccordionProps {
    steps: CheckpointStepView[];
    currentCheckpointId: number | null;
}

/* ─────────────────────────────────────────────────────── helpers ── */

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

/* ─────────────────────────────────── status dot + pill components ── */

interface StatusPillProps {
    raw: string;
}

function StatusPill({ raw }: StatusPillProps) {
    const v = statusVariant(raw);
    const label = statusLabel(raw);

    const cls =
        v === "done"
            ? "bg-[#06283A]/8 text-[#06283A] border border-[#06283A]/15"
            : v === "active"
            ? "bg-amber-50 text-amber-800 border border-amber-200"
            : "bg-slate-100 text-slate-400 border border-slate-200";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cls}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    v === "done" ? "bg-[#06283A]" : v === "active" ? "bg-amber-500" : "bg-slate-300"
                }`}
            />
            {label}
        </span>
    );
}

/* ─────────────────────────────────────── accordion panel content ── */

interface PanelContentProps {
    step: CheckpointStepView;
}

function PanelContent({ step }: PanelContentProps) {
    const movements = step.movements ?? [];
    const [activeMovementId, setActiveMovementId] = useState<string | null>(
        movements[0]?.id ?? null
    );

    useEffect(() => {
        setActiveMovementId(movements[0]?.id ?? null);
    }, [step.checkpointId]);

    const activeMovement = movements.find((m) => m.id === activeMovementId) ?? movements[0];
    const report: CheckpointLatestReport | null = activeMovement?.report ?? step.latestReport;
    const formValues = report?.formValues ?? [];
    const photos = report?.photos ?? [];

    const snapshot = step.templateSnapshot;
    const requiredFields = (snapshot?.fields ?? []) as Array<{
        key: string;
        label: string;
        required: boolean;
        field_type?: string;
    }>;
    const requiredPhotoSlots = (snapshot?.photo_slots ?? []) as Array<{
        key: string;
        label: string;
        required: boolean;
    }>;
    const formValuesMap = new Map(formValues.map((fv) => [fv.fieldKey, fv.value]));

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

    return (
        <div className="divide-y divide-slate-100">
            {/* ── Armada switcher ─────────────────────────────────────── */}
            {movements.length > 1 && (
                <div className="px-6 py-4">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Armada ({movements.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {movements.map((m) => {
                            const isSel = activeMovementId === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setActiveMovementId(m.id)}
                                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                                        isSel
                                            ? "border-[#06283A] bg-[#06283A] text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                    {m.name}
                                    <span
                                        className={`ml-2 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                            isSel
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {statusLabel(m.status)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Form field checklist ─────────────────────────────────── */}
            {requiredFields.length > 0 && (
                <div className="px-6 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Data Laporan
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {requiredFields.map((field) => {
                            const value = formValuesMap.get(field.key);
                            const filled = Boolean(value);
                            return (
                                <div
                                    key={field.key}
                                    className={`rounded-lg border p-3 transition-colors ${
                                        filled
                                            ? "border-slate-200 bg-white"
                                            : "border-dashed border-slate-200 bg-slate-50/60"
                                    }`}
                                >
                                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                        {field.label}
                                    </span>
                                    <span
                                        className={`mt-1 block text-[13px] font-semibold leading-snug ${
                                            filled ? "text-[#06283A]" : "italic text-slate-300"
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

            {/* ── Photo checklist grid ─────────────────────────────────── */}
            {requiredPhotoSlots.length > 0 && (
                <div className="px-6 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Foto Bukti ({photos.length}/{requiredPhotoSlots.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {requiredPhotoSlots.map((slot, idx) => {
                            const photo: CheckpointReportPhoto | undefined = photos[idx];
                            return photo ? (
                                <button
                                    key={slot.key}
                                    type="button"
                                    onClick={() => setLightbox({ url: photo.photoUrl, caption: slot.label })}
                                    className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-pointer hover:border-slate-400 transition"
                                >
                                    <img
                                        src={photo.photoUrl}
                                        alt={slot.label}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                        <p className="truncate text-[10px] font-semibold text-white">
                                            {slot.label}
                                        </p>
                                    </div>
                                </button>
                            ) : (
                                <div
                                    key={slot.key}
                                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center"
                                >
                                    <span className="text-[10px] font-medium text-slate-300 leading-tight">
                                        {slot.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── PIC & catatan ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {/* PIC */}
                <div className="px-6 py-4">
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
                            <p className="mt-0.5 text-xs font-medium text-slate-700">
                                {fmtDate(step.actualStart)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400">Selesai</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">
                                {fmtDate(step.actualFinish)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Catatan */}
                <div className="px-6 py-4">
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

            {/* ── Photo Lightbox ───────────────────────────────────────── */}
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

/* ─────────────────────────────────────────── accordion item ── */

interface AccordionItemProps {
    step: CheckpointStepView;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    isCurrent: boolean;
}

function AccordionItem({ step, index, isOpen, onToggle, isCurrent }: AccordionItemProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const v = statusVariant(step.status ?? "pending");
    const movements = step.movements ?? [];

    return (
        <div
            className={`overflow-hidden rounded-xl border transition-colors ${
                isOpen
                    ? "border-[#06283A]/20 bg-white shadow-sm"
                    : isCurrent
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300"
            }`}
        >
            {/* ── Accordion trigger ── */}
            <button
                type="button"
                id={`accordion-trigger-${step.checkpointId}`}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${step.checkpointId}`}
                onClick={onToggle}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition cursor-pointer"
            >
                {/* Step number badge */}
                <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                        v === "done"
                            ? "bg-[#06283A] text-white"
                            : v === "active"
                            ? "border-2 border-amber-400 bg-white text-amber-700"
                            : "border border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                >
                    {index + 1}
                </div>

                {/* Title + meta */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`text-sm font-semibold leading-none ${
                                isOpen ? "text-[#06283A]" : "text-slate-800"
                            }`}
                        >
                            {step.title}
                        </span>
                        <StatusPill raw={step.status ?? "pending"} />
                        {isCurrent && !isOpen && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Tahap Aktif
                            </span>
                        )}
                    </div>
                    {movements.length > 0 && (
                        <p className="mt-1 text-[11px] text-slate-400">
                            {movements.length} armada
                            {step.picName ? ` · PIC: ${step.picName}` : ""}
                        </p>
                    )}
                </div>

                {/* Chevron */}
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* ── Accordion panel (animated height) ── */}
            <div
                id={`accordion-panel-${step.checkpointId}`}
                role="region"
                aria-labelledby={`accordion-trigger-${step.checkpointId}`}
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
                <div className="border-t border-slate-100">
                    <PanelContent step={step} />
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────── main export ── */

export default function CheckpointAccordion({
    steps,
    currentCheckpointId,
}: CheckpointAccordionProps) {
    // Default: open the current active step, or first step
    const defaultOpen =
        currentCheckpointId && steps.some((s) => s.checkpointId === currentCheckpointId)
            ? currentCheckpointId
            : (steps[0]?.checkpointId ?? null);

    const [openId, setOpenId] = useState<number | null>(defaultOpen);

    const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

    return (
        <div className="space-y-2">
            {steps.map((step, i) => (
                <AccordionItem
                    key={step.checkpointId}
                    step={step}
                    index={i}
                    isOpen={openId === step.checkpointId}
                    onToggle={() => toggle(step.checkpointId)}
                    isCurrent={step.checkpointId === currentCheckpointId}
                />
            ))}
        </div>
    );
}
