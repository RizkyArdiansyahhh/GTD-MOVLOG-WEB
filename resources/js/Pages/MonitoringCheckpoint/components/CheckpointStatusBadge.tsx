import React from "react";
import { FALLBACK_CHECKPOINT_LABEL } from "../constants/checkpointSteps";

interface CheckpointStatusBadgeProps {
    label: string | null;
}

/**
 * Badge kecil menampilkan checkpoint terkini sebuah shipment.
 * Dipakai di kolom status pada CheckpointTable & header CheckpointDetail.
 * Label datang langsung dari backend (checkpoints.name), bukan lagi hardcode.
 */
export default function CheckpointStatusBadge({ label }: CheckpointStatusBadgeProps) {
    const isNotStarted = !label;
    const displayLabel = label ?? FALLBACK_CHECKPOINT_LABEL;

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
                backgroundColor: isNotStarted ? "#F1F5F9" : "#FFF4D6",
                color: isNotStarted ? "#64748B" : "#B7791F",
            }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: isNotStarted ? "#94A3B8" : "#B7791F" }}
            />
            {displayLabel}
        </span>
    );
}