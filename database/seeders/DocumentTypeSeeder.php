<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $documentTypes = [
            ['id' => 1, 'name' => 'Bill of Lading'],
            ['id' => 2, 'name' => 'Commercial Invoice'],
            ['id' => 3, 'name' => 'Packing List'],
            ['id' => 4, 'name' => 'Certificate of Origin'],
            ['id' => 5, 'name' => 'Insurance'],
        ];

        foreach ($documentTypes as $type) {
            DB::table('document_types')->updateOrInsert(
                ['id' => $type['id']],
                [
                    'name' => $type['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('document_types', 'id'), COALESCE((SELECT MAX(id) FROM document_types), 1))");
        }
    }
}