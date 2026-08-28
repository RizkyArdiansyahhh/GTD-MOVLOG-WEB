import React from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CheckpointDetailHeader from "./components/CheckpointDetailHeader";
import CheckpointStepTimeline from "./components/CheckpointStepTimeline";
import type { CheckpointDetailPageProps } from "./types/MonitoringCheckpoint";

/**
 * Halaman detail penuh 1 shipment (bukan drawer/overlay).
 * Route: GET /monitoring-checkpoint/{assignmentNo}
 *
 * Menampilkan:
 * - Header dengan assignment_no sebagai identifier utama
 * - Vertical timeline 4 step checkpoint (atas ke bawah)
 */
export default function CheckpointDetail({ shipment }: CheckpointDetailPageProps) {
    const currentStep = shipment.steps.find((step) => step.checkpointId === shipment.currentCheckpointId);

    return (
        <DashboardLayout>
            <Head title={`Checkpoint - ${shipment.assignmentNo}`} />

            <div className="mx-auto max-w-4xl px-4 py-8">
                <CheckpointDetailHeader
                    assignmentNo={shipment.assignmentNo}
                    customerName={shipment.customerName}
                    currentCheckpointLabel={currentStep?.title ?? null}
                />

                <CheckpointStepTimeline steps={shipment.steps} />
            </div>
        </DashboardLayout>
    );
}