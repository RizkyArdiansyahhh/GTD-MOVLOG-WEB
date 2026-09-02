<?php

// database/seeders/CustomerSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'company_name' => 'PT Trans Cargo Indonesia',
                'address' => 'Jl. Yos Sudarso No. 45, Tanjung Priok',
                'phone' => '021-5551234',
                'email' => 'ops@transcargo.co.id',
                'pic_name' => 'Budi Santoso',
            ],
            [
                'company_name' => 'PT Sinar Jaya Logistik',
                'address' => 'Jl. Perak Timur No. 12, Surabaya',
                'phone' => '031-5559876',
                'email' => 'admin@sinarjayalogistik.co.id',
                'pic_name' => 'Siti Rahayu',
            ],
            [
                'company_name' => 'PT Customer A',
                'address' => 'Jl. Sudirman No. 100, Jakarta',
                'phone' => '021-5550001',
                'email' => 'customer@lms.local',
                'pic_name' => 'Ahmad Customer',
            ],
            [
                'company_name' => 'PT United Mining',
                'address' => 'Jl. Gajah Mada No. 88, Balikpapan',
                'phone' => '0542-555222',
                'email' => 'logistics@unitedmining.co.id',
                'pic_name' => 'Hendra Mining',
            ],
            [
                'company_name' => 'PT Kalimantan Coal',
                'address' => 'Jl. Yos Sudarso No. 12, Samarinda',
                'phone' => '0541-555333',
                'email' => 'supply@kalimantancoal.com',
                'pic_name' => 'Bambang Coal',
            ],
        ];

        foreach ($data as $item) {
            Customer::updateOrCreate(
                ['company_name' => $item['company_name']],
                $item
            );
        }
    }
}