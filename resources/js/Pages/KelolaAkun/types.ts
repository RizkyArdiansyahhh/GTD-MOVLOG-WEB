// ─────────────────────────────────────────────
// Types for Kelola Akun page
// ─────────────────────────────────────────────

export type UserRole = string;

export type UserStatus = 'Active' | 'Inactive' | 'Aktif' | 'Tidak Aktif';

export interface KelolaAkunUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: UserStatus;
    avatarUrl: string;
    phone?: string | null;
    createdAt?: string;
}

export interface UserStatsData {
    label: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    accent: string;
}
