export interface CustomerCompany {
    id: string;
    company_name: string;
    pic_name: string | null;
    email: string | null;
    phone: string | null;
}

export interface CustomerStats {
    total_shipments: number;
    active_shipments: number;
    completed_shipments: number;
    total_cargo_tonnage: number;
}

export interface ShipmentCheckpointItem {
    id: string;
    checkpoint_id: string | number;
    name: string;
    sequence: number;
    status: string;
    actual_start: string | null;
    actual_finish: string | null;
    is_completed: boolean;
    is_active: boolean;
}

export interface ShipmentSummary {
    id: string;
    assignment_no: string;
    cargo_name: string;
    total_quantity: number;
    unit: string;
    origin: string;
    destination: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    status_label: string;
    current_checkpoint: string;
    progress_percentage: number;
    total_checkpoints: number;
    completed_checkpoints: number;
    checkpoints?: ShipmentCheckpointItem[];
    is_completed?: boolean;
    created_at?: string;
    updated_at: string;
}

export interface CheckpointDetail {
    id: string;
    sequence: number;
    name: string;
    description: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    status_label: string;
    actual_start: string | null;
    actual_finish: string | null;
    pic_name: string;
    pic_phone: string | null;
}

export interface DocumentItem {
    id: string;
    type_name: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    status_label: string;
    file_name: string | null;
    verified_at: string | null;
    is_downloadable: boolean;
}

export interface DocumentSummary {
    total: number;
    verified: number;
    pending: number;
    percentage: number;
    items: DocumentItem[];
}

export interface ActivePIC {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
}

export interface CheckpointOverviewGroup {
    checkpoint_name: string;
    sequence: number;
    shipments: {
        id: string;
        assignment_no: string;
        cargo_name: string;
        total_quantity: number;
        unit: string;
        origin: string | null;
        destination: string | null;
        status_label: string;
    }[];
}
