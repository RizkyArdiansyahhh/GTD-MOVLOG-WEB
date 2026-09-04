import React from "react";
import { Check } from "lucide-react";
import type { CheckpointStepView } from "../types/MonitoringCheckpoint";

interface CheckpointHorizontalStepperProps {
    steps: CheckpointStepView[];
    selectedStepId: number;
    onSelectStep: (checkpointId: number) => void;
}

/**
 * Stepper horizontal minimalis, ramping, dan luxury.
 * Sesuai referensi gambar: bulatan simpel, garis presisi, warna brand GTD Dark Navy & Gold.
 */
export default function CheckpointHorizontalStepper({
    steps,
    selectedStepId,
    onSelectStep,
}: CheckpointHorizontalStepperProps) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="relative mx-auto max-w-3xl">
                {/* Stepper Track */}
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const rawStatus = (step.status ?? "pending").toLowerCase();
                        const isCompleted = rawStatus === "completed" || rawStatus === "selesai";
                        const isInProgress = rawStatus === "in_progress" || rawStatus === "aktif";
                        const isSelected = step.checkpointId === selectedStepId;
                        const isLast = index === steps.length - 1;

                        // Cek apakah step berikutnya juga completed untuk warna garis penghubung
                        const nextStep = steps[index + 1];
                        const nextRawStatus = (nextStep?.status ?? "pending").toLowerCase();
                        const nextIsCompleted = nextRawStatus === "completed" || nextRawStatus === "selesai";
                        const isLineActive = isCompleted && (nextIsCompleted || nextRawStatus === "in_progress");

                        return (
                            <React.Fragment key={step.checkpointId}>
                                {/* Node Circle & Label */}
                                <button
                                    type="button"
                                    onClick={() => onSelectStep(step.checkpointId)}
                                    className="group relative z-10 flex flex-col items-center focus:outline-hidden cursor-pointer"
                                >
                                    {/* Circle Button */}
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                                            isSelected
                                                ? "ring-3 ring-[#06283A]/20 scale-105"
                                                : "group-hover:scale-105"
                                        } ${
                                            isCompleted
                                                ? "bg-[#06283A] text-white shadow-2xs"
                                                : isInProgress
                                                ? "border-2 border-[#B7791F] bg-amber-50 text-[#B7791F] shadow-2xs font-bold"
                                                : "border border-slate-300 bg-white text-slate-400 font-medium"
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4 stroke-[2.5]" />
                                        ) : (
                                            <span className="text-xs">
                                                {step.order}
                                            </span>
                                        )}
                                    </div>

                                    {/* Label Bawah */}
                                    <div className="mt-2 text-center">
                                        <span
                                            className={`text-[10px] uppercase tracking-wider block transition-colors ${
                                                isSelected
                                                    ? "font-bold text-[#06283A]"
                                                    : "font-medium text-slate-400 group-hover:text-slate-600"
                                            }`}
                                        >
                                            Tahap {step.order}
                                        </span>
                                        <span
                                            className={`text-xs block transition-colors ${
                                                isSelected
                                                    ? "font-bold text-[#06283A]"
                                                    : isCompleted
                                                    ? "font-medium text-slate-700 group-hover:text-[#06283A]"
                                                    : "font-normal text-slate-500 group-hover:text-slate-700"
                                            }`}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                </button>

                                {/* Connecting Line */}
                                {!isLast && (
                                    <div className="relative flex-1 mx-2 sm:mx-3 -mt-6">
                                        <div className="h-0.5 w-full rounded-full bg-slate-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    isLineActive
                                                        ? "bg-[#06283A] w-full"
                                                        : isCompleted
                                                        ? "bg-[#06283A] w-1/2"
                                                        : "w-0"
                                                }`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
