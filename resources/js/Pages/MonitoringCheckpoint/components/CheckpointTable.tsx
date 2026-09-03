import React from "react";
import { router } from "@inertiajs/react";
import CheckpointStatusBadge from "./CheckpointStatusBadge";
import type { ShipmentCheckpointSummary } from "../types/MonitoringCheckpoint";

interface CheckpointTableProps {
    shipments: ShipmentCheckpointSummary[];
}

/**
 * Tabel utama halaman index: 1 baris = 1 shipment (1 shipping_sessions row,
 * diidentifikasi via assignment_no).
 * Klik baris -> navigasi ke halaman detail penuh (bukan drawer overlay).
 */
export default function CheckpointTable({ shipments }: CheckpointTableProps) {
    const handleRowClick = (assignmentNo: string) => {
        router.visit(`/monitoring-checkpoint/${assignmentNo}`);
    };

    if (shipments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <p className="text-sm font-medium text-slate-500">No shipment data available to display.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 font-semibold text-slate-600">Assignment No.</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Current Checkpoint</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Progress</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {shipments.map((shipment) => (
                        <tr
                            key={shipment.id}
                            onClick={() => handleRowClick(shipment.assignmentNo)}
                            className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                        >
                            <td className="px-4 py-3 font-medium" style={{ color: "#06283A" }}>
                                {shipment.assignmentNo}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{shipment.customerName}</td>
                            <td className="px-4 py-3">
                                <CheckpointStatusBadge label={shipment.currentCheckpointLabel} />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${shipment.progressPercentage}%`,
                                                backgroundColor: "#B7791F",
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">{shipment.progressPercentage}%</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                                {shipment.lastUpdatedAt
                                    ? new Date(shipment.lastUpdatedAt).toLocaleString("en-US", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })
                                    : "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}