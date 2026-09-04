<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\ReportValue;
use App\Models\TemplateField;
use Illuminate\Database\Seeder;

class ReportValueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        $reports = Report::with(['sessionCheckpoint.checkpoint', 'movement'])->get();

        foreach ($reports as $report) {
            $checkpointName = $report->sessionCheckpoint?->checkpoint?->name;
            $movementName = $report->movement?->movement_name ?? '';

            $valuesMap = [];

            if ($checkpointName === 'Kapal') {
                $tongkangName = str_contains($movementName, '02')
                    ? 'BG Samudera Perkasa 02'
                    : 'BG Marine Power 3001';

                $valuesMap = [
                    'nama_mv'       => 'KM Nusantara Jaya 08',
                    'nama_tongkang' => $tongkangName,
                    'ciqp_status'   => 'CLEARED',
                ];
            } elseif ($checkpointName === 'Tongkang') {
                $dermaga = str_contains($movementName, '02')
                    ? 'Dermaga 03 Pelindo Semayang'
                    : 'Dermaga 02 Pelindo Semayang';

                $valuesMap = [
                    'dermaga_pelindo' => $dermaga,
                    'waktu_sandar'    => '2026-08-31 14:30',
                    'lokasi_storage'  => 'Area Penumpukan Staging C-4',
                ];
            } elseif ($checkpointName === 'Pelabuhan') {
                if (str_contains($movementName, '8831')) {
                    $valuesMap = [
                        'license_plate'     => 'KT 8831 QA',
                        'driver_name'       => 'Agus Setiawan (Supir 1)',
                        'packing_list_item' => 'Excavator CAT 320 Main Unit #1',
                    ];
                } elseif (str_contains($movementName, '9482')) {
                    $valuesMap = [
                        'license_plate'     => 'B 9482 UT',
                        'driver_name'       => 'Bambang S. (Supir 2)',
                        'packing_list_item' => 'Excavator CAT 320 Main Unit #2',
                    ];
                } else {
                    $valuesMap = [
                        'license_plate'     => 'KT 7712 MZ',
                        'driver_name'       => 'Dedi Kurniawan (Supir 3)',
                        'packing_list_item' => 'Excavator CAT 320 Main Unit #3',
                    ];
                }
            } elseif ($checkpointName === 'Site') {
                $valuesMap = [
                    'nama_penerima_site' => 'Ir. Hendra Kusuma (Site Manager)',
                    'kondisi_barang'     => 'Lengkap, Aman & Berfungsi Normal (Good Condition)',
                ];
            }

            foreach ($valuesMap as $fieldKey => $val) {
                $templateField = TemplateField::where('field_key', $fieldKey)->first();
                if (!$templateField) {
                    continue;
                }

                ReportValue::updateOrCreate(
                    [
                        'report_id'         => $report->id,
                        'template_field_id' => $templateField->id,
                    ],
                    [
                        'value' => (string) $val,
                    ]
                );
            }
        }
    }
}
