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
    public function run(): void
    {
        // --- Super Admin -----------------------------------------------
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@lms.local'],
            [
                'name'              => 'Super Admin',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        // --- Supervisor ------------------------------------------------
        $supervisor = User::updateOrCreate(
            ['email' => 'supervisor@lms.local'],
            [
                'name'              => 'Supervisor Operasional',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $supervisor->assignRole(UserRole::Supervisor->value);

        // --- Staff -----------------------------------------------------
        $staff = User::updateOrCreate(
            ['email' => 'staff@lms.local'],
            [
                'name'              => 'Staff Logistik',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $staff->assignRole(UserRole::Staff->value);

        // --- Field Worker (Budi Santoso) ------------------------------
        $fieldWorker = User::updateOrCreate(
            ['email' => 'fieldworker@lms.local'],
            [
                'name'              => 'Budi Santoso',
                'phone'             => '+62 812 3456 7890',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $fieldWorker->assignRole(UserRole::FieldWorker->value);

        // --- Field Worker 2 (Rudi Hermawan) ---------------------------
        $fieldWorker2 = User::updateOrCreate(
            ['email' => 'rudi.h@lms.local'],
            [
                'name'              => 'Rudi Hermawan',
                'phone'             => '+62 813 9876 5432',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $fieldWorker2->assignRole(UserRole::FieldWorker->value);

        // --- Customer --------------------------------------------------
        $customer = User::updateOrCreate(
            ['email' => 'customer@lms.local'],
            [
                'name'              => 'PT Customer A (Hendra W)',
                'password'          => Hash::make('Admin@1234'),
                'status'            => UserStatus::Active->value,
                'email_verified_at' => now(),
            ]
        );
        $customer->assignRole(UserRole::Customer->value);
    }
}