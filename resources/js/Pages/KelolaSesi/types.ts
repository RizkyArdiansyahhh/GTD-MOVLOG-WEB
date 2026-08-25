export type LogisticsStage = 'Kapal' | 'Tongkang' | 'Pelabuhan' | 'Site';

export type StageType = 'kapal' | 'tongkang' | 'pelabuhan' | 'site';
export type StageStatus = 'pending' | 'aktif' | 'selesai';

export interface FieldWorker {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    employee_id?: string;
    role_label?: string;
    status_label?: string;
}

export interface SessionStage {
    id: string;
    stage_type: StageType;
    stage_order: number;
    status: StageStatus;
    pic_user: FieldWorker | null;
    workers: FieldWorker[];
    notes: string | null;
    started_at: string | null;
    completed_at: string | null;
}

export interface SessionUnit {
    id?: string;
    unit_name: string;
    quantity: number;
    notes?: string | null;
}

export interface WorkSession {
    id: string;
    sessionId: string;
    units: SessionUnit[];
    stages: SessionStage[];
    notes: string | null;
    createdAt?: string;
    // Derived fields for backward compat / table display
    unitName: string;
    currentStage: LogisticsStage;
    petugas: string;
}

export const STAGE_LABELS: Record<StageType, string> = {
    kapal: 'Kapal',
    tongkang: 'Tongkang',
    pelabuhan: 'Pelabuhan',
    site: 'Site',
};

export const STAGE_ORDER: StageType[] = ['kapal', 'tongkang', 'pelabuhan', 'site'];
