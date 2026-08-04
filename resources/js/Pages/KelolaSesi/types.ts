export type LogisticsStage = 'Kapal' | 'Tongkang' | 'Pelabuhan' | 'Site';

export interface FieldWorker {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    employee_id?: string;
    role_label?: string;
    status_label?: string;
}

export interface WorkSession {
    id: string;
    unitName: string;
    currentStage: LogisticsStage;
    field_worker_id?: string;
    petugas: string;
    createdAt?: string;
}

