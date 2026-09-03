import React from "react";
import CheckpointStepCard from "./CheckpointStepCard";
import { GitCommit, CheckCircle2 } from "lucide-react";
import type { CheckpointStepView } from "../types/MonitoringCheckpoint";

interface CheckpointStepTimelineProps {
    steps: CheckpointStepView[];
}

/**
 * Stepper timeline vertikal untuk alur checkpoint pengiriman.
 */
export default function CheckpointStepTimeline({ steps }: CheckpointStepTimelineProps) {
    const completedCount = steps.filter((step) => step.status === "COMPLETED").length;
    const isAllCompleted = completedCount === steps.length && steps.length > 0;

    return (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
            {/* Header Timeline */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#06283A]">
                        <GitCommit className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-[#06283A]">
                            Riwayat Perpindahan Checkpoint
                        </h2>
                        <p className="text-xs text-slate-500">
                            Progres bertahap dari pemindahan muatan kargo
                        </p>
                    </div>
                </div>

                <div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            isAllCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-700"
                        }`}
                    >
                        {isAllCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        {completedCount} dari {steps.length} Selesai
                    </span>
                </div>
            </div>

            {/* Stepper Steps List */}
            <div className="pt-2">
                {steps.map((step, index) => (
                    <CheckpointStepCard
                        key={step.checkpointId}
                        step={step}
                        isLast={index === steps.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}