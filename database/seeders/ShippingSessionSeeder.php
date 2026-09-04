<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Database\Seeder;

class ShippingSessionSeeder extends Seeder
{
    public function run(): void
    {
        $defaultCust = Customer::first();
        $superAdmin = User::where('email', 'superadmin@lms.local')->first() ?? User::first();
        $custA = Customer::where('email', 'customer@lms.local')->first() ?? $defaultCust;
        $custMining = Customer::where('email', 'logistics@unitedmining.co.id')->first() ?? $defaultCust;
        $custCoal = Customer::where('email', 'supply@kalimantancoal.com')->first() ?? $defaultCust;
        $custTrans = Customer::where('email', 'ops@transcargo.co.id')->first() ?? $defaultCust;
        $custSinar = Customer::where('email', 'admin@sinarjayalogistik.co.id')->first() ?? $defaultCust;

        $cpKapal = Checkpoint::where('name', 'Kapal')->first();
        $cpTongkang = Checkpoint::where('name', 'Tongkang')->first();
        $cpPelabuhan = Checkpoint::where('name', 'Pelabuhan')->first();
        $cpSite = Checkpoint::where('name', 'Site')->first();

        $sessions = [
            [
                'assignment_no'         => 'TRK-2024-001',
                'cargo_name'            => 'Excavator CAT 320',
                'customer_id'           => $custA?->id,
                'created_by'            => $superAdmin?->id,
                'total_quantity'        => 1.00,
                'unit'                  => 'Unit',
                'origin'                => 'Tanjung Priok, Jakarta',
                'destination'           => 'Site Batubara, Balikpapan',
                'current_checkpoint_id' => $cpPelabuhan?->id,
                'status'                => 'in_transit',
            ],
            [
                'assignment_no'         => 'SES-2048',
                'cargo_name'            => 'Excavator CAT 320 GC',
                'customer_id'           => $custMining?->id,
                'created_by'            => $superAdmin?->id,
                'total_quantity'        => 2.00,
                'unit'                  => 'Unit',
                'origin'                => 'Pelabuhan Merak',
                'destination'           => 'Site Tambang Morowali',
                'current_checkpoint_id' => $cpPelabuhan?->id,
                'status'                => 'in_transit',
            ],
            [
                'assignment_no'         => 'TRK-2024-002',
                'cargo_name'            => 'Dump Truck Hino 500',
                'customer_id'           => $custCoal?->id,
                'created_by'            => $superAdmin?->id,
                'total_quantity'        => 4.00,
                'unit'                  => 'Unit',
                'origin'                => 'Surabaya Port',
                'destination'           => 'Pelabuhan Semayang, Balikpapan',
                'current_checkpoint_id' => $cpTongkang?->id,
                'status'                => 'in_transit',
            ],
            [
                'assignment_no'         => 'TRK-2024-003',
                'cargo_name'            => 'Komatsu PC200-8 Heavy Excavator',
                'customer_id'           => $custMining?->id,
                'created_by'            => $superAdmin?->id,
                'total_quantity'        => 1.00,
                'unit'                  => 'Unit',
                'origin'                => 'Balikpapan',
                'destination'           => 'Site Muara Wahau',
                'current_checkpoint_id' => $cpSite?->id,
                'status'                => 'delivered',
            ],
            [
                'assignment_no'         => 'TRK-2024-004',
                'cargo_name'            => 'Generator Set Cummins 1500 kVA',
                'customer_id'           => $custTrans?->id,
                'created_by'            => $superAdmin?->id,
                'total_quantity'        => 2.00,
                'unit'                  => 'Unit',
                'origin'                => 'Tanjung Priok, Jakarta',
                'destination'           => 'Site Sorowako, Morowali',
                'current_checkpoint_id' => $cpKapal?->id,
                'status'                => 'in_transit',
            ],
        ];

        foreach ($sessions as $data) {
            if ($data['customer_id'] && $data['created_by']) {
                ShippingSession::updateOrCreate(
                    ['assignment_no' => $data['assignment_no']],
                    $data
                );
            }
        }
    }
}
