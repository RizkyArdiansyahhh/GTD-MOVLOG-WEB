import React, { useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CheckpointTable from "./components/CheckpointTable";
import SearchBar from "./components/SearchBar";
import { Navigation, Clock, CheckCircle2, AlertCircle, Compass } from "lucide-react";
import type { MonitoringCheckpointPageProps } from "./types/MonitoringCheckpoint";

/**
 * Halaman index Monitoring Checkpoint.
 * Menampilkan ringkasan KPI metrik pengiriman, pencarian, dan tabel status shipment.
 */
export default function MonitoringCheckpoint({ shipments }: MonitoringCheckpointPageProps) {
    const [search, setSearch] = useState("");

    const filteredShipments = useMemo(() => {
        if (!search.trim()) return shipments;
        const keyword = search.trim().toLowerCase();
        return shipments.filter(
            (shipment) =>
                shipment.assignmentNo.toLowerCase().includes(keyword) ||
                shipment.customerName.toLowerCase().includes(keyword),
        );
    }, [shipments, search]);

    // Ringkasan KPI metrik dari data pengiriman
    const stats = useMemo(() => {
        const total = shipments.length;
        const completed = shipments.filter((s) => s.progressPercentage >= 100).length;
        const inProgress = shipments.filter((s) => s.progressPercentage > 0 && s.progressPercentage < 100).length;
        const pending = shipments.filter((s) => s.progressPercentage === 0).length;
        return { total, completed, inProgress, pending };
    }, [shipments]);

    return (
        <DashboardLayout>
            <Head title="Monitoring Checkpoint" />

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[#06283A] mb-2">
                            <Compass className="h-3.5 w-3.5 text-[#B7791F]" />
                            <span>Logistik & Pelacakan Kargo</span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-[#06283A] tracking-tight">
                            Monitoring Checkpoint
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Pantau pergerakan kargo bertahap: <span className="font-medium text-slate-700">MV &rarr; Tongkang &rarr; Pelabuhan &rarr; Site</span>
                        </p>
                    </div>
                </div>

                {/* ── Stats Cards Grid (4 Kolom) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Shipment */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Total Pengiriman</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#06283A]">
                                <Navigation className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-[#06283A]">{stats.total}</p>
                    </div>

                    {/* Sedang Berjalan */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Sedang Berjalan</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-[#B7791F]">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-amber-900">{stats.inProgress}</p>
                    </div>

                    {/* Selesai */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Selesai (100%)</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-emerald-700">{stats.completed}</p>
                    </div>

                    {/* Belum Dimulai */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Belum Dimulai</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-slate-600">{stats.pending}</p>
                    </div>
                </div>

                {/* ── Table Section ── */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                        <h2 className="text-base font-bold text-[#06283A]">
                            Daftar Penugasan Pengiriman ({filteredShipments.length})
                        </h2>
                        <div className="w-full sm:w-80">
                            <SearchBar value={search} onChange={setSearch} />
                        </div>
                    </div>

                    <CheckpointTable shipments={filteredShipments} />
                </div>
            </div>
        </DashboardLayout>
    );
}