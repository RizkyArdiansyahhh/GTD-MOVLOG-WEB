<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Admin User Seeder
 *
 * Creates the default super-admin and admin users for the system.
 */
class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ─── Super Admin ───────────────────────────────────────────────────
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@lms.local'],
            [
                'name'              => 'Super Admin',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        // ─── Admin ─────────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@lms.local'],
            [
                'name'              => 'Admin LMS',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole(UserRole::Admin->value);

        // ─── Manager ───────────────────────────────────────────────────────
        $manager = User::firstOrCreate(
            ['email' => 'manager@lms.local'],
            [
                'name'              => 'Manager LMS',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $manager->assignRole(UserRole::Manager->value);

        $this->command->info('✅ Admin users seeded successfully.');
        $this->command->table(
            ['Email', 'Password', 'Role'],
            [
                ['superadmin@lms.local', 'Admin@1234', UserRole::SuperAdmin->label()],
                ['admin@lms.local', 'Admin@1234', UserRole::Admin->label()],
                ['manager@lms.local', 'Admin@1234', UserRole::Manager->label()],
            ]
        );
    }
}
