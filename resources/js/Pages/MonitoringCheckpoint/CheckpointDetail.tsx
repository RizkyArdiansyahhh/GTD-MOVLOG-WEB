import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import CheckpointDetailHeader from "./components/CheckpointDetailHeader";
import CheckpointHorizontalStepper from "./components/CheckpointHorizontalStepper";
import CheckpointSelectedDetail from "./components/CheckpointSelectedDetail";
import type { CheckpointDetailPageProps } from "./types/MonitoringCheckpoint";

/**
 * Halaman detail penuh 1 shipment (Monitoring Checkpoint).
 * Menggunakan Horizontal Stepper + Single-Step Detail dengan accordion armada.
 * Route: GET /monitoring-checkpoint/{assignmentNo}
 */
export default function CheckpointDetail({ shipment }: CheckpointDetailPageProps) {
    const steps = shipment.steps ?? [];

    const defaultStepId =
        shipment.currentCheckpointId &&
        steps.some((s) => s.checkpointId === shipment.currentCheckpointId)
            ? shipment.currentCheckpointId
            : (steps[0]?.checkpointId ?? 1);

    const [selectedStepId, setSelectedStepId] = useState<number>(defaultStepId);

    const selectedStep = steps.find((s) => s.checkpointId === selectedStepId) ?? steps[0];
    const selectedIndex = steps.findIndex((s) => s.checkpointId === selectedStepId);
    const hasPrev = selectedIndex > 0;
    const hasNext = selectedIndex < steps.length - 1;

    const completedCount = steps.filter((s) => {
        const raw = (s.status ?? "").toLowerCase();
        return raw === "completed" || raw === "selesai";
    }).length;

    const progressPercentage =
        steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

    const currentStep = steps.find((s) => s.checkpointId === shipment.currentCheckpointId);

    return (
        <DashboardLayout>
            <Head title={`Checkpoint — ${shipment.assignmentNo}`} />

            <div className="mx-auto max-w-6xl space-y-6">
                <CheckpointDetailHeader
                    assignmentNo={shipment.assignmentNo}
                    customerName={shipment.customerName}
                    cargoName={shipment.cargoName}
                    currentCheckpointLabel={currentStep?.title ?? null}
                    completedSteps={completedCount}
                    totalSteps={steps.length}
                    progressPercentage={progressPercentage}
                />

                <CheckpointHorizontalStepper
                    steps={steps}
                    selectedStepId={selectedStepId}
                    onSelectStep={(id) => setSelectedStepId(id)}
                />

                {selectedStep && (
                    <CheckpointSelectedDetail
                        step={selectedStep}
                        totalSteps={steps.length}
                        onPrevStep={() =>
                            hasPrev && setSelectedStepId(steps[selectedIndex - 1].checkpointId)
                        }
                        onNextStep={() =>
                            hasNext && setSelectedStepId(steps[selectedIndex + 1].checkpointId)
                        }
                        hasPrev={hasPrev}
                        hasNext={hasNext}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}