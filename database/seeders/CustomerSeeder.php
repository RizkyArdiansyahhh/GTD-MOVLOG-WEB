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
        ];

        foreach ($data as $item) {
            Customer::updateOrCreate(
                ['company_name' => $item['company_name']],
                $item
            );
        }
    }
}