import React from "react";
import { FALLBACK_CHECKPOINT_LABEL } from "../constants/checkpointSteps";

interface CheckpointStatusBadgeProps {
    label: string | null;
}

/**
 * Badge status checkpoint dengan gaya khas tema GTD.
 * Menampilkan lokasi/nama checkpoint saat ini atau fallback jika belum dimulai.
 */
export default function CheckpointStatusBadge({ label }: CheckpointStatusBadgeProps) {
    const isNotStarted = !label;
    const displayLabel = label ?? FALLBACK_CHECKPOINT_LABEL;

    if (isNotStarted) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {displayLabel}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-xs">
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B7791F]" />
            </span>
            {displayLabel}
        </span>
    );
}