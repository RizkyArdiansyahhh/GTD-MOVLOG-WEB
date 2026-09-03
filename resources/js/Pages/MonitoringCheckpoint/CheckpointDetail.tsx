import React from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CheckpointDetailHeader from "./components/CheckpointDetailHeader";
import CheckpointStepTimeline from "./components/CheckpointStepTimeline";
import type { CheckpointDetailPageProps } from "./types/MonitoringCheckpoint";

/**
 * Halaman detail penuh 1 shipment (Monitoring Checkpoint).
 * Route: GET /monitoring-checkpoint/{assignmentNo}
 */
export default function CheckpointDetail({ shipment }: CheckpointDetailPageProps) {
    const currentStep = shipment.steps.find((step) => step.checkpointId === shipment.currentCheckpointId);

    return (
        <DashboardLayout>
            <Head title={`Detail Checkpoint - ${shipment.assignmentNo}`} />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <CheckpointDetailHeader
                    assignmentNo={shipment.assignmentNo}
                    customerName={shipment.customerName}
                    cargoName={shipment.cargoName}
                    currentCheckpointLabel={currentStep?.title ?? null}
                />

                <CheckpointStepTimeline steps={shipment.steps} />
            </div>
        </DashboardLayout>
    );
}