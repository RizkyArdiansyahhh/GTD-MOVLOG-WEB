export interface CustomerCompany {
    id: string;
    company_name: string;
    pic_name: string | null;
    email?: string | null;
    phone?: string | null;
}

export interface CustomerStats {
    total_shipments: number;
    active_shipments: number;
    in_transit: number;
    completed_last_7d: number;
    total_cargo_tonnage: number;
    completed_shipments?: number;
}

export interface ShipmentSummary {
    id: string;
    assignment_no: string;
    cargo_name: string;
    origin: string;
    destination: string;
    status: string;
    quantity: number;
    unit: string;
    current_checkpoint: string | null;
    progress_percent: number;
    eta: string;
    units: Array<{ name: string; qty: number }>;
}

export interface CheckpointOverviewGroup {
    id: number;
    name: string;
    sequence: number;
    active_fleets: number;
    shipments: Array<{
        id: string;
        assignment_no: string;
        cargo_name: string;
        total_quantity?: number;
        unit?: string;
        origin?: string | null;
        destination?: string | null;
        status_label?: string;
    }>;
}

export interface ShipmentTimelineItem {
    checkpoint_name: string;
    sequence: number;
    status: string;
    actual_start: string | null;
    actual_finish: string | null;
    pic_name: string | null;
}

export interface VerifiedDocument {
    id: string;
    file_name: string;
    file_path: string;
    document_type: string;
    document_type_code: string;
    verified_at: string;
    verified_by: string;
    remarks: string | null;
}

export interface ShipmentDetail {
    id: string;
    assignment_no: string;
    cargo_name: string;
    total_quantity: number;
    unit: string;
    origin: string;
    destination: string;
    status: string;
    notes: string | null;
    created_at: string;
    progress_percent: number;
    eta?: string;
    current_checkpoint?: string;
}

export interface CustomerShipmentListItem {
    id: string;
    assignment_no: string;
    cargo_name: string;
    origin: string;
    destination: string;
    status: string;
    quantity: number;
    unit: string;
    current_checkpoint: string;
    progress_percent: number;
    created_at: string;
    eta?: string;
    units?: Array<{ name: string; qty: number }>;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface SessionUnitItem {
    unit_name: string;
    quantity: number;
    notes: string | null;
}
