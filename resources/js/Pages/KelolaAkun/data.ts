import type { KelolaAkunUser } from './types';

// ─────────────────────────────────────────────
// Current user definition
// ─────────────────────────────────────────────
export const currentUser = {
    id: '01kyq6j11vme0rhn60aac5z3x9',
    name: 'Super Admin',
    email: 'superadmin@lms.local',
    role: 'super-admin',
};

// ─────────────────────────────────────────────
// Users from AdminUserSeeder.php
// ─────────────────────────────────────────────
export const seederUsers: KelolaAkunUser[] = [
    {
        id: '01kyq6j11vme0rhn60aac5z3x9',
        name: 'Super Admin',
        email: 'superadmin@lms.local',
        role: 'Super Admin',
        status: 'Aktif',
        avatarUrl: 'https://ui-avatars.com/api/?name=Super+Admin&background=F5B800&color=fff&bold=true&size=128',
        lastActive: 'Baru saja',
    },
    {
        id: '01kyq6j18p5d35nvehgfvbjhhq',
        name: 'Supervisor',
        email: 'supervisor@lms.local',
        role: 'Supervisor',
        status: 'Aktif',
        avatarUrl: 'https://ui-avatars.com/api/?name=Supervisor&background=3b82f6&color=fff&bold=true&size=128',
        lastActive: '10 menit lalu',
    },
    {
        id: '01kyq6j1ewy5ka4qjbx347zn04',
        name: 'Staff',
        email: 'staff@lms.local',
        role: 'Staff',
        status: 'Aktif',
        avatarUrl: 'https://ui-avatars.com/api/?name=Staff&background=8b5cf6&color=fff&bold=true&size=128',
        lastActive: '1 jam lalu',
    },
    {
        id: '01kyq6j1n63xft7xdbqcx8f6qr',
        name: 'Field Worker',
        email: 'fieldworker@lms.local',
        role: 'Field Worker',
        status: 'Aktif',
        avatarUrl: 'https://ui-avatars.com/api/?name=Field+Worker&background=10b981&color=fff&bold=true&size=128',
        lastActive: '2 jam lalu',
    },
    {
        id: '01kyq6j1vaka0pdt5dyz0d780t',
        name: 'Customer',
        email: 'customer@lms.local',
        role: 'Customer',
        status: 'Aktif',
        avatarUrl: 'https://ui-avatars.com/api/?name=Customer&background=6b7280&color=fff&bold=true&size=128',
        lastActive: '3 jam lalu',
    },
];

// ─────────────────────────────────────────────
// Summary statistics matching seeder
// ─────────────────────────────────────────────
export const seederStats = {
    totalPengguna: 5,
    totalPenggunaBulanIni: 5,
    adminInternal: 4,
    customer: 1,
    akunNonaktif: 0,
};

// ─────────────────────────────────────────────
// Filter options
// ─────────────────────────────────────────────
export const roleOptions = [
    'Semua Role',
    'Super Admin',
    'Supervisor',
    'Staff',
    'Field Worker',
    'Customer',
] as const;

export const statusOptions = [
    'Semua Status',
    'Aktif',
    'Tidak Aktif',
] as const;
