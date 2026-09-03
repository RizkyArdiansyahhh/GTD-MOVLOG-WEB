import React from "react";
import { router } from "@inertiajs/react";
import { ChevronRight, Clock, Building2, PackageSearch, ArrowUpRight } from "lucide-react";
import CheckpointStatusBadge from "./CheckpointStatusBadge";
import type { ShipmentCheckpointSummary } from "../types/MonitoringCheckpoint";

interface CheckpointTableProps {
    shipments: ShipmentCheckpointSummary[];
}

/**
 * Tabel pengiriman Checkpoint modern bertema GTD.
 * Menampilkan ringkasan status perjalanan kargo per assignment.
 */
export default function CheckpointTable({ shipments }: CheckpointTableProps) {
    const handleRowClick = (assignmentNo: string) => {
        router.visit(`/monitoring-checkpoint/${assignmentNo}`);
    };

    if (shipments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <PackageSearch className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">Tidak Ada Data Pengiriman</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Belum ada shipment yang terdaftar atau tidak ditemukan data yang sesuai dengan pencarian Anda.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200/80 bg-[#F8FAFC]">
                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                No. Assignment
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Customer
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Checkpoint Terkini
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Progress
                            </th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Update Terakhir
                            </th>
                            <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Detail
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shipments.map((shipment) => {
                            const isCompleted = shipment.progressPercentage >= 100;
                            const isZero = shipment.progressPercentage === 0;

                            return (
                                <tr
                                    key={shipment.id}
                                    onClick={() => handleRowClick(shipment.assignmentNo)}
                                    className="group cursor-pointer transition-colors duration-150 hover:bg-slate-50/80"
                                >
                                    {/* No. Assignment */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#06283A] group-hover:bg-[#06283A] group-hover:text-white transition-colors">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-[#06283A] text-sm tracking-tight block">
                                                    {shipment.assignmentNo}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Customer */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                                {shipment.customerName ? shipment.customerName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            <span className="font-medium text-slate-700 max-w-[200px] truncate block">
                                                {shipment.customerName}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Checkpoint Status */}
                                    <td className="px-5 py-4">
                                        <CheckpointStatusBadge label={shipment.currentCheckpointLabel} />
                                    </td>

                                    {/* Progress */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${shipment.progressPercentage}%`,
                                                        backgroundColor: isCompleted
                                                            ? "#16A34A"
                                                            : isZero
                                                            ? "#CBD5E1"
                                                            : "#B7791F",
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className={`text-xs font-semibold ${
                                                    isCompleted
                                                        ? "text-emerald-700"
                                                        : isZero
                                                        ? "text-slate-400"
                                                        : "text-amber-800"
                                                }`}
                                            >
                                                {shipment.progressPercentage}%
                                            </span>
                                        </div>
                                    </td>

                                    {/* Update Terakhir */}
                                    <td className="px-5 py-4 text-xs text-slate-500">
                                        {shipment.lastUpdatedAt ? (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                <span>
                                                    {new Date(shipment.lastUpdatedAt).toLocaleString("id-ID", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>

                                    {/* Arrow Action */}
                                    <td className="px-4 py-4 text-right">
                                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#06283A]">
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}