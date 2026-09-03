export interface TemplateFieldItem {
    id?: number;
    field_name: string;
    field_key?: string | null;
    label?: string | null;
    field_type: 'text' | 'number' | 'dropdown' | 'date' | 'photo';
    required: boolean;
    options?: string[] | null;
    sort_order?: number;
}

export interface MasterTemplateItem {
    id: number;
    name: string;
    description?: string | null;
    checkpoint_id: number;
    checkpoint_name?: string;
    checkpoint_sequence?: number;
    applies_to_report_type: string;
    fields_count: number;
    photo_slots_count: number;
    total_fields_count: number;
    is_used: boolean;
    created_at?: string;
    updated_at?: string;
    fields?: TemplateFieldItem[];
}

export interface CheckpointOption {
    id: number;
    name: string;
    sequence: number;
    type: string;
}
