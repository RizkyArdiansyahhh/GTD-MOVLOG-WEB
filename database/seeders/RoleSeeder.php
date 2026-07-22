<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */

        $permissions = [

            // User
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Customer
            'customers.view',
            'customers.create',
            'customers.update',
            'customers.delete',

            // Shipping Session
            'shipping_sessions.view',
            'shipping_sessions.create',
            'shipping_sessions.update',
            'shipping_sessions.delete',

            // Document
            'documents.view',
            'documents.upload',
            'documents.verify',

            // Checkpoint
            'checkpoints.view',
            'checkpoints.update',

            // Movement
            'movements.view',
            'movements.create',
            'movements.update',

            // Report
            'reports.view',
            'reports.create',
            'reports.update',
            'reports.export',

            // System
            'roles.manage',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);

            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'sanctum',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Super Admin
        |--------------------------------------------------------------------------
        */

        Role::firstOrCreate([
            'name' => UserRole::SuperAdmin->value,
            'guard_name' => 'web',
        ]);

        Role::firstOrCreate([
            'name' => UserRole::SuperAdmin->value,
            'guard_name' => 'sanctum',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Supervisor
        |--------------------------------------------------------------------------
        */

        $supervisor = Role::firstOrCreate([
            'name' => UserRole::Supervisor->value,
            'guard_name' => 'web',
        ]);

        Role::firstOrCreate([
            'name' => UserRole::Supervisor->value,
            'guard_name' => 'sanctum',
        ]);

        $supervisor->syncPermissions([
            'users.view',

            'customers.view',
            'customers.create',
            'customers.update',

            'shipping_sessions.view',
            'shipping_sessions.create',
            'shipping_sessions.update',

            'documents.view',
            'documents.verify',

            'checkpoints.view',

            'movements.view',

            'reports.view',
            'reports.export',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Staff
        |--------------------------------------------------------------------------
        */

        $staff = Role::firstOrCreate([
            'name' => UserRole::Staff->value,
            'guard_name' => 'web',
        ]);

        Role::firstOrCreate([
            'name' => UserRole::Staff->value,
            'guard_name' => 'sanctum',
        ]);

        $staff->syncPermissions([
            'customers.view',
            'customers.create',
            'customers.update',

            'shipping_sessions.view',
            'shipping_sessions.create',
            'shipping_sessions.update',

            'documents.view',
            'documents.upload',

            'reports.view',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Field Worker (Mobile)
        |--------------------------------------------------------------------------
        */

        $fieldWorker = Role::firstOrCreate([
            'name' => UserRole::FieldWorker->value,
            'guard_name' => 'web',
        ]);

        Role::firstOrCreate([
            'name' => UserRole::FieldWorker->value,
            'guard_name' => 'sanctum',
        ]);

        $fieldWorker->syncPermissions([
            'shipping_sessions.view',

            'documents.view',
            'documents.upload',

            'checkpoints.view',
            'checkpoints.update',

            'movements.view',
            'movements.create',
            'movements.update',

            'reports.view',
            'reports.create',
            'reports.update',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Customer
        |--------------------------------------------------------------------------
        */

        $customer = Role::firstOrCreate([
            'name' => UserRole::Customer->value,
            'guard_name' => 'web',
        ]);

        Role::firstOrCreate([
            'name' => UserRole::Customer->value,
            'guard_name' => 'sanctum',
        ]);

        $customer->syncPermissions([
            'shipping_sessions.view',
            'documents.view',
            'reports.view',
        ]);

        $this->command->info('✅ Roles & permissions seeded successfully.');
    }
}