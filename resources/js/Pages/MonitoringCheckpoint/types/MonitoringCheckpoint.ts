/**
 * Type contracts untuk modul MonitoringCheckpoint.
 *
 * Konteks bisnis (disesuaikan dengan skema DB asli project):
 * - 1 shipment = 1 shipping_sessions row, diidentifikasi via assignment_no.
 * - checkpoints: tabel master, 4 baris tetap & linear (MV -> Tongkang -> Pelabuhan -> Site).
 * - session_checkpoints: baris penghubung shipping_session <-> checkpoint,
 *   menyimpan pic_user_id, status, actual_start, actual_finish.
 * - reports: laporan progress lapangan, banyak report bisa dimiliki 1 session_checkpoint
 *   (progress bertahap). Yang ditampilkan sebagai ringkasan step = report TERBARU (event_at desc).
 * - report_photos: foto milik 1 report.
 * - "Lokasi" pada UI TIDAK diambil dari kolom DB terpisah, melainkan cukup label
 *   checkpoint itu sendiri (mis. "MV ke Tongkang"), karena tidak ada kolom location string.
 * - Data checkpoint diinput oleh Field Officer via mobile app (di luar scope modul ini).
 * - Modul ini murni read-only: tabel ringkas (index) + halaman detail penuh (timeline).
 */

/** Status proses 1 session_checkpoint, mengikuti kolom session_checkpoints.status */
export type SessionCheckpointStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

/** Definisi statis 1 baris tabel master checkpoints. */
export interface CheckpointDefinition {
    id: number;
    order: number; // urutan tampil, 1 - 4
    name: string; // contoh: "MV ke Tongkang"
    description?: string | null;
}

/** 1 foto pada sebuah report (dari report_photos). */
export interface CheckpointReportPhoto {
    id: string;
    photoUrl: string;
    caption: string | null;
    isCover: boolean;
    takenAt: string | null; // ISO timestamp
}

export interface ReportFormFieldValue {
    id: string;
    fieldKey: string;
    label: string;
    value: string;
    fieldType: string;
}

/** Ringkasan report TERBARU milik 1 session_checkpoint (dipakai sebagai "detail step"). */
export interface CheckpointLatestReport {
    id: string;
    eventAt: string | null; // ISO timestamp
    description: string | null;
    movedQuantity: number | null;
    latitude: number | null;
    longitude: number | null;
    formValues?: ReportFormFieldValue[];
    photos: CheckpointReportPhoto[];
}

export interface MovementItemView {
    id: string;
    name: string;
    type: string;
    status: string;
    report: CheckpointLatestReport | null;
}

/** Data 1 session_checkpoint untuk 1 shipment, digabung dengan definisi checkpoint & report terbaru. */
export interface CheckpointStepView {
    checkpointId: number;
    order: number;
    title: string; // dari checkpoints.name, jadi "lokasi" step di UI
    status: SessionCheckpointStatus | "pending"; // "pending" = belum ada session_checkpoint sama sekali
    picName: string | null; // dari session_checkpoints.pic_user_id -> users.name
    actualStart: string | null;
    actualFinish: string | null;
    templateSnapshot?: Record<string, any> | null;
    movements?: MovementItemView[];
    latestReport: CheckpointLatestReport | null;
}

/** Ringkasan 1 shipment untuk baris tabel di halaman index. */
export interface ShipmentCheckpointSummary {
    id: string; // shipping_sessions.id (ULID)
    assignmentNo: string;
    customerName: string;
    currentCheckpointId: number | null;
    currentCheckpointLabel: string;
    lastUpdatedAt: string | null; // actual_finish / actual_start checkpoint terkini
    progressPercentage: number; // 0 - 100, dihitung dari jumlah checkpoint COMPLETED / total checkpoint
}

/** Detail lengkap 1 shipment untuk halaman CheckpointDetail.tsx. */
export interface ShipmentCheckpointDetail {
    id: string;
    assignmentNo: string;
    customerName: string;
    cargoName: string;
    currentCheckpointId: number | null;
    steps: CheckpointStepView[]; // selalu 4 item, urut sesuai checkpoints.order
}

/** Props Inertia untuk halaman index MonitoringCheckpoint.tsx */
export interface MonitoringCheckpointPageProps {
    shipments: ShipmentCheckpointSummary[];
}

/** Props Inertia untuk halaman CheckpointDetail.tsx */
export interface CheckpointDetailPageProps {
    shipment: ShipmentCheckpointDetail;
}