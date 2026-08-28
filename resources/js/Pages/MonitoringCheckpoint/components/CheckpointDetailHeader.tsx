import React from "react";
import { router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import CheckpointStatusBadge from "./CheckpointStatusBadge";

interface CheckpointDetailHeaderProps {
    assignmentNo: string;
    customerName: string;
    currentCheckpointLabel: string | null;
}

/**
 * Header halaman CheckpointDetail.tsx.
 * assignment_no ditampilkan paling menonjol karena merupakan
 * identifier utama 1 shipment (1 shipment = 1 shipping_sessions row).
 */
export default function CheckpointDetailHeader({
    assignmentNo,
    customerName,
    currentCheckpointLabel,
}: CheckpointDetailHeaderProps) {
    return (
        <div className="mb-6">
            <button
                onClick={() => router.visit("/monitoring-checkpoint")}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Monitoring
            </button>

            <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-6">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">No. Assignment</p>
                    <h1 className="mt-1 text-2xl font-bold" style={{ color: "#06283A" }}>
                        {assignmentNo}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{customerName}</p>
                </div>
                <CheckpointStatusBadge label={currentCheckpointLabel} />
            </div>
        </div>
    );
}