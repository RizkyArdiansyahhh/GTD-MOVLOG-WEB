// Global type declarations for the LMS application

export interface Customer {
    id: string;
    company_name: string;
    pic_name?: string | null;
    email?: string | null;
    phone?: string | null;
}

export interface User {
    id: string | number;
    name: string;
    email: string;
    status: string;
    status_label: string;
    phone: string | null;
    avatar?: string | null;
    avatar_url: string | null;
    roles: string[];
    permissions: string[];
    customer?: Customer | null;
    created_at: string;
    updated_at: string;
}

export interface CustomerNotificationItem {
    id: string;
    type: string;
    title: string;
    assignment_no?: string | null;
    url: string;
    read_at: string | null;
    created_at: string;
    created_at_human: string;
}

export interface CustomerNotificationsData {
    unread_count: number;
    latest: CustomerNotificationItem[];
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface PaginationLinks {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
    links: PaginationLinks;
}

export interface PageProps {
    auth: {
        user: User;
    };
    notifications?: CustomerNotificationsData | null;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}
