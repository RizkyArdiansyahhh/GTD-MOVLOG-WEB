<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Commercial Invoice', 'description' => 'Faktur komersial transaksi barang'],
            ['name' => 'Bill of Lading', 'description' => 'Surat tanda terima dan bukti kepemilikan kargo pengapalan'],
            ['name' => 'Packing List', 'description' => 'Rincian spesifikasi dan dimensi kemasan kargo'],
            ['name' => 'Insurance', 'description' => 'Polis asuransi perlindungan kargo logistik'],
            ['name' => 'Certificate of Origin (COO)', 'description' => 'Surat keterangan asal barang'],
        ];

        foreach ($types as $type) {
            DocumentType::firstOrCreate(
                ['name' => $type['name']],
                ['description' => $type['description']]
            );
        }
    }
}