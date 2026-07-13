<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Database Seeder
 *
 * Orchestrates all seeders. Run them in the correct dependency order.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting database seeding...');

        $this->call([
            RoleSeeder::class,      // Must run first: creates roles & permissions
            AdminUserSeeder::class, // Depends on roles
        ]);

        $this->command->info('✅ Database seeding completed!');
    }
}
