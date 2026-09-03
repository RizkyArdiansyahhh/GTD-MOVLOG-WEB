import React from "react";
import { router } from "@inertiajs/react";
import { ArrowLeft, Building2, Package, Hash } from "lucide-react";
import CheckpointStatusBadge from "./CheckpointStatusBadge";

interface CheckpointDetailHeaderProps {
    assignmentNo: string;
    customerName: string;
    currentCheckpointLabel: string | null;
    cargoName?: string;
}

/**
 * Header halaman CheckpointDetail.tsx dengan gaya visual modern bertema GTD.
 */
export default function CheckpointDetailHeader({
    assignmentNo,
    customerName,
    currentCheckpointLabel,
    cargoName,
}: CheckpointDetailHeaderProps) {
    return (
        <div className="mb-6 space-y-4">
            {/* Tombol Kembali */}
            <div>
                <button
                    type="button"
                    onClick={() => router.visit("/monitoring-checkpoint")}
                    className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-[#06283A]"
                >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Kembali ke Monitoring
                </button>
            </div>

            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                <Hash className="h-3 w-3 text-slate-400" />
                                No. Assignment
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-[#06283A] sm:text-3xl">
                            {assignmentNo}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-medium text-slate-700">{customerName}</span>
                            </div>

                            {cargoName && (
                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                    <Package className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-medium text-slate-700">{cargoName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Status Saat Ini
                        </span>
                        <CheckpointStatusBadge label={currentCheckpointLabel} />
                    </div>
                </div>
            </div>
        </div>
    );
}