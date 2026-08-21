<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Checkpoint;
use Illuminate\Database\Seeder;

class CheckpointSeeder extends Seeder
{
    public function run(): void
    {
        $checkpoints = [
            ['name' => 'Kapal', 'sequence' => 1, 'description' => 'Proses pengiriman menggunakan Kapal Utama'],
            ['name' => 'Tongkang', 'sequence' => 2, 'description' => 'Transfer kargo melalui Tongkang ke muara'],
            ['name' => 'Pelabuhan', 'sequence' => 3, 'description' => 'Bongkar muat dan inspeksi di Pelabuhan Semayang'],
            ['name' => 'Site', 'sequence' => 4, 'description' => 'Tiba di lokasi site tambang / proyek tujuan akhir'],
        ];

        foreach ($checkpoints as $cp) {
            Checkpoint::firstOrCreate(
                ['name' => $cp['name']],
                ['sequence' => $cp['sequence'], 'description' => $cp['description']]
            );
        }
    }
}