export type SearchCategoryType = 'barang' | 'sesi' | 'dokumen' | 'checkpoint' | 'users';

export interface SearchResultItem {
    id: string;
    category: SearchCategoryType;
    category_label: string;
    title: string;
    subtitle: string;
    status: string;
    status_type: string;
    url: string;
    metadata?: Record<string, any>;
}

export interface SearchCategoryGroup {
    label: string;
    count: number;
    items: SearchResultItem[];
}

export interface QuickSearchResponse {
    query: string;
    categories: Record<string, SearchCategoryGroup>;
    total_count: number;
}

export interface FullSearchData {
    query: string;
    active_category: string;
    category_counts: Record<string, { label: string; count: number }>;
    results: SearchResultItem[];
    total_count: number;
}