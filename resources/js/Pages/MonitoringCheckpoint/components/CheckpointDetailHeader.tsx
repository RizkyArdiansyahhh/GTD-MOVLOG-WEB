import React from "react";
import { router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

interface CheckpointDetailHeaderProps {
    assignmentNo: string;
    customerName: string;
    currentCheckpointLabel: string | null;
    cargoName?: string;
    completedSteps?: number;
    totalSteps?: number;
    progressPercentage?: number;
}

/**
 * Header halaman CheckpointDetail — clean, minimal, luxury.
 * Tidak ada icon berlebihan. Hanya teks & progress bar.
 */
export default function CheckpointDetailHeader({
    assignmentNo,
    customerName,
    cargoName,
    completedSteps = 0,
    totalSteps = 4,
    progressPercentage = 0,
}: CheckpointDetailHeaderProps) {
    return (
        <div className="space-y-3">
            {/* Back button */}
            <button
                type="button"
                onClick={() => router.visit("/monitoring-checkpoint")}
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-[#06283A] cursor-pointer"
            >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Kembali ke Monitoring
            </button>

            {/* Hero card */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Nomor Penugasan
                        </p>
                        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#06283A]">
                            {assignmentNo}
                        </h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{customerName}</span>
                            {cargoName && (
                                <>
                                    <span className="text-slate-300">·</span>
                                    <span>{cargoName}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: progress */}
                    <div className="flex items-center gap-6 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Progres
                                </span>
                                <span className="text-xs font-bold text-[#06283A]">
                                    {completedSteps}/{totalSteps} Tahap
                                </span>
                            </div>
                            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progressPercentage}%`,
                                        backgroundColor:
                                            progressPercentage >= 100 ? "#06283A" : "#B7791F",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}