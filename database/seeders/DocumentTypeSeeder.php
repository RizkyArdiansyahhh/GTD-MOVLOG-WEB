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
    }
}