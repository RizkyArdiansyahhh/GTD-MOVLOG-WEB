<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Database\Seeder;

/**
 * Role Seeder
 *
 * Creates all roles and permissions for the Logistics Management System.
 */
class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── Define Permissions ────────────────────────────────────────────
        $permissions = [
            // User management
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Shipment management
            'shipments.view',
            'shipments.create',
            'shipments.update',
            'shipments.delete',
            'shipments.assign',

            // Driver management
            'drivers.view',
            'drivers.assign',

            // Warehouse management
            'warehouse.view',
            'warehouse.manage',

            // Reports
            'reports.view',
            'reports.export',

            // System
            'system.settings',
            'system.roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // ─── Create Roles & Assign Permissions ────────────────────────────
        // Super Admin — full access (bypass via Policy::before)
        $superAdmin = Role::firstOrCreate(['name' => UserRole::SuperAdmin->value, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => UserRole::SuperAdmin->value, 'guard_name' => 'sanctum']);

        // Admin
        $admin = Role::firstOrCreate(['name' => UserRole::Admin->value, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => UserRole::Admin->value, 'guard_name' => 'sanctum']);
        $admin->syncPermissions([
            'users.view', 'users.create', 'users.update',
            'shipments.view', 'shipments.create', 'shipments.update', 'shipments.assign',
            'drivers.view', 'drivers.assign',
            'warehouse.view', 'warehouse.manage',
            'reports.view', 'reports.export',
        ]);

        // Manager
        $manager = Role::firstOrCreate(['name' => UserRole::Manager->value, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => UserRole::Manager->value, 'guard_name' => 'sanctum']);
        $manager->syncPermissions([
            'users.view',
            'shipments.view', 'shipments.create', 'shipments.update', 'shipments.assign',
            'drivers.view', 'drivers.assign',
            'warehouse.view',
            'reports.view',
        ]);

        // Driver
        $driver = Role::firstOrCreate(['name' => UserRole::Driver->value, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => UserRole::Driver->value, 'guard_name' => 'sanctum']);
        $driver->syncPermissions([
            'shipments.view',
        ]);

        // Warehouse Staff
        $warehouse = Role::firstOrCreate(['name' => UserRole::Warehouse->value, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => UserRole::Warehouse->value, 'guard_name' => 'sanctum']);
        $warehouse->syncPermissions([
            'shipments.view',
            'warehouse.view', 'warehouse.manage',
        ]);

        // Customer
        $customer = Role::firstOrCreate(['name' => UserRole::Customer->value, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => UserRole::Customer->value, 'guard_name' => 'sanctum']);
        $customer->syncPermissions([
            'shipments.view',
        ]);

        $this->command->info('✅ Roles and permissions seeded successfully.');
    }
}
