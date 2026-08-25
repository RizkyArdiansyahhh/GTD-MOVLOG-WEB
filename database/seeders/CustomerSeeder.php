<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'company_name' => 'PT Customer A',
                'address'      => 'Jl. Jenderal Sudirman No. 45, Jakarta Selatan',
                'phone'        => '+62 21 555 1234',
                'email'        => 'customer@lms.local',
                'pic_name'     => 'Hendra Wijaya',
            ],
            [
                'company_name' => 'PT United Mining Nusantara',
                'address'      => 'Kawasan Industri Kariangau Blok B-8, Balikpapan',
                'phone'        => '+62 542 889 001',
                'email'        => 'logistics@unitedmining.co.id',
                'pic_name'     => 'Agus Prasetyo',
            ],
            [
                'company_name' => 'PT Kalimantan Coal Energi',
                'address'      => 'Jl. Mulawarman KM 13, Samarinda',
                'phone'        => '+62 541 772 334',
                'email'        => 'supply@kalimantancoal.com',
                'pic_name'     => 'Dewi Anggraini',
            ],
        ];

        foreach ($customers as $cust) {
            Customer::firstOrCreate(
                ['email' => $cust['email']],
                $cust
            );
        }
    }
}
