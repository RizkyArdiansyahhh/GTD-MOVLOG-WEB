<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Default User Seeder
 *
 * Creates default users for each role.
 */
class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ─── Super Admin ───────────────────────────────────────────────
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

        // ─── Supervisor ────────────────────────────────────────────────
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@lms.local'],
            [
                'name'              => 'Supervisor',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );

        $supervisor->assignRole(UserRole::Supervisor->value);

        // ─── Staff ─────────────────────────────────────────────────────
        $staff = User::firstOrCreate(
            ['email' => 'staff@lms.local'],
            [
                'name'              => 'Staff',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );

        $staff->assignRole(UserRole::Staff->value);

        // ─── Field Worker ──────────────────────────────────────────────
        $fieldWorker = User::firstOrCreate(
            ['email' => 'fieldworker@lms.local'],
            [
                'name'              => 'Field Worker',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );

        $fieldWorker->assignRole(UserRole::FieldWorker->value);

        // ─── Customer ──────────────────────────────────────────────────
        $customer = User::firstOrCreate(
            ['email' => 'customer@lms.local'],
            [
                'name'              => 'Customer',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );

        $customer->assignRole(UserRole::Customer->value);

        $this->command->info('✅ Default users seeded successfully.');

        $this->command->table(
            ['Email', 'Password', 'Role'],
            [
                ['superadmin@lms.local', 'Admin@1234', UserRole::SuperAdmin->label()],
                ['supervisor@lms.local', 'Admin@1234', UserRole::Supervisor->label()],
                ['staff@lms.local', 'Admin@1234', UserRole::Staff->label()],
                ['fieldworker@lms.local', 'Admin@1234', UserRole::FieldWorker->label()],
                ['customer@lms.local', 'Admin@1234', UserRole::Customer->label()],
            ]
        );
    }
}