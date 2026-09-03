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

export interface TemplateFieldOption {
    field_key: string;
    label: string;
    field_type: string;
    required: boolean;
    options?: string[] | null;
    sort_order?: number;
}

export interface TemplatePhotoSlot {
    field_key: string;
    label: string;
    field_type: 'photo';
    required: boolean;
    sort_order?: number;
}

export interface TemplateSnapshot {
    template_id: number;
    template_name: string;
    fields: TemplateFieldOption[];
    photo_slots: TemplatePhotoSlot[];
    applies_to_report_type?: string;
}

export interface ReportPhotoItem {
    id: string;
    template_field_id?: number | null;
    field_key?: string;
    photo_url: string;
    caption?: string | null;
    taken_at?: string | null;
}

export interface MovementReport {
    id: string;
    status: 'draft' | 'in_progress' | 'completed';
    event_at: string | null;
    latitude: number | null;
    longitude: number | null;
    values: Record<string, string | number | boolean | null>;
    photos: ReportPhotoItem[];
}

export interface MovementItem {
    id: string;
    movement_name: string;
    movement_type: string;
    parent_movement_id?: string | null;
    parent_name?: string | null;
    sequence: number;
    status: string;
    report_status: 'not_started' | 'draft' | 'in_progress' | 'completed';
    is_completed: boolean;
    report: MovementReport | null;
}

export interface ParentTongkangOption {
    id: string;
    movement_name: string;
}

export interface SessionStage {
    id: string;
    stage_type: StageType;
    stage_name?: string;
    stage_order: number;
    status: StageStatus;
    can_add_movement?: boolean;
    movement_label?: string;
    completed_movement_count?: number;
    total_movement_count?: number;
    is_ready_to_complete?: boolean;
    template_snapshot?: TemplateSnapshot | null;
    available_parents?: ParentTongkangOption[];
    movements?: MovementItem[];
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
    status?: string;
    units: SessionUnit[];
    stages: SessionStage[];
    notes: string | null;
    createdAt?: string;
    // Derived fields for backward compat / table display
    unitName?: string;
    currentStage?: LogisticsStage;
    petugas?: string;
}

export const STAGE_LABELS: Record<StageType, string> = {
    kapal: 'Kapal',
    tongkang: 'Tongkang',
    pelabuhan: 'Pelabuhan',
    site: 'Site',
};

export const STAGE_ORDER: StageType[] = ['kapal', 'tongkang', 'pelabuhan', 'site'];
