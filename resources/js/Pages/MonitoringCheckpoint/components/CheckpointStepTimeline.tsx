import React from "react";
import CheckpointStepCard from "./CheckpointStepCard";
import type { CheckpointStepView } from "../types/MonitoringCheckpoint";

interface CheckpointStepTimelineProps {
    steps: CheckpointStepView[];
}

/**
 * Vertical stepper timeline, arah atas ke bawah, untuk 4 checkpoint tetap.
 * Urutan step mengikuti urutan array `steps` yang sudah disortir oleh backend
 * / halaman pemanggil sesuai constants/checkpointSteps.ts.
 */
export default function CheckpointStepTimeline({ steps }: CheckpointStepTimelineProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Riwayat Perpindahan Checkpoint
            </h2>
            <div>
                {steps.map((step, index) => (
                    <CheckpointStepCard key={step.checkpointId} step={step} isLast={index === steps.length - 1} />
                ))}
            </div>
        </div>
    );
}