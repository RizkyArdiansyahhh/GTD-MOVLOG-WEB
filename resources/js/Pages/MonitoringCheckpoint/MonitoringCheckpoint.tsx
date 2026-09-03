import React, { useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CheckpointTable from "./components/CheckpointTable";
import SearchBar from "./components/SearchBar";
import type { MonitoringCheckpointPageProps } from "./types/MonitoringCheckpoint";

/**
 * Halaman index Monitoring Checkpoint.
 * Read-only: menampilkan 1 baris = 1 shipment, klik baris -> halaman detail.
 * Tidak ada filter kompleks untuk saat ini, hanya search sederhana (client-side).
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

    return (
        <DashboardLayout>
            <Head title="Checkpoint Monitoring" />

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: "#06283A" }}>
                            Checkpoint Monitoring
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitor cargo movement status: MV &rarr; Barge &rarr; Port &rarr; Site.
                        </p>
                    </div>
                    <SearchBar value={search} onChange={setSearch} />
                </div>

                <CheckpointTable shipments={filteredShipments} />
            </div>
        </DashboardLayout>
    );
}