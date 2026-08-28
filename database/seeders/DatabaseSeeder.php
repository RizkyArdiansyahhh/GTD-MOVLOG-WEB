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
            CustomerSeeder::class,  // Must run before AdminUserSeeder to link customer accounts
            AdminUserSeeder::class, // Depends on roles & customer
            CheckpointSeeder::class,
            DocumentTypeSeeder::class,
            ReportTemplateSeeder::class,
            TemplateFieldSeeder::class,
            ShippingSessionSeeder::class,
            SessionCheckpointSeeder::class,
            MovementSeeder::class,
            DocumentSeeder::class,
            ReportSeeder::class,
            ReportValueSeeder::class,
            ReportPhotoSeeder::class,
        ]);

        $this->command->info('✅ Database seeding completed!');
    }
}