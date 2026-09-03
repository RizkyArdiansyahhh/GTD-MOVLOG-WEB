<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ReportType;
use App\Models\Checkpoint;
use App\Models\ReportTemplate;
use App\Models\TemplateField;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReportTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templateDefinitions = [
            // STEP 1 — STS / KAPAL
            [
                'checkpoint_name' => 'Kapal',
                'name' => 'Laporan STS (Bongkar MV ke Tongkang)',
                'description' => 'Requirement laporan proses Ship-to-Ship pembongkaran dari Mother Vessel ke Tongkang',
                'applies_to_report_type' => ReportType::Movement,
                'fields' => [
                    [
                        'field_key'   => 'nama_mv',
                        'field_name'  => 'nama_mv',
                        'label'       => 'Nama MV',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 1,
                    ],
                    [
                        'field_key'   => 'nama_tongkang',
                        'field_name'  => 'nama_tongkang',
                        'label'       => 'Nama Tongkang',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 2,
                    ],
                    [
                        'field_key'   => 'ciqp_status',
                        'field_name'  => 'ciqp_status',
                        'label'       => 'CIQP Status',
                        'field_type'  => 'dropdown',
                        'required'    => true,
                        'options'     => ['CLEARED', 'IN_PROGRESS', 'PENDING', 'REJECTED'],
                        'sort_order'  => 3,
                    ],
                    [
                        'field_key'   => 'foto_equipment_lct',
                        'field_name'  => 'foto_equipment_lct',
                        'label'       => 'Foto Equipment LCT',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 4,
                    ],
                    [
                        'field_key'   => 'foto_ciqp_approval',
                        'field_name'  => 'foto_ciqp_approval',
                        'label'       => 'Foto CIQP Approval',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 5,
                    ],
                    [
                        'field_key'   => 'foto_lashing_tongkang',
                        'field_name'  => 'foto_lashing_tongkang',
                        'label'       => 'Foto Lashing Tongkang',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 6,
                    ],
                    [
                        'field_key'   => 'foto_barge_cast_off',
                        'field_name'  => 'foto_barge_cast_off',
                        'label'       => 'Foto Barge Cast Off',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 7,
                    ],
                ],
            ],

            // STEP 2 — TONGKANG / PELABUHAN
            [
                'checkpoint_name' => 'Tongkang',
                'name' => 'Laporan Tongkang (Transport & Sandar Pelindo)',
                'description' => 'Requirement laporan proses transfer tongkang dan sandar di dermaga Pelindo',
                'applies_to_report_type' => ReportType::Movement,
                'fields' => [
                    [
                        'field_key'   => 'dermaga_pelindo',
                        'field_name'  => 'dermaga_pelindo',
                        'label'       => 'Dermaga Pelindo',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 1,
                    ],
                    [
                        'field_key'   => 'waktu_sandar',
                        'field_name'  => 'waktu_sandar',
                        'label'       => 'Waktu Sandar',
                        'field_type'  => 'datetime',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 2,
                    ],
                    [
                        'field_key'   => 'lokasi_storage',
                        'field_name'  => 'lokasi_storage',
                        'label'       => 'Lokasi Storage',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 3,
                    ],
                    [
                        'field_key'   => 'foto_crane_sling_prep',
                        'field_name'  => 'foto_crane_sling_prep',
                        'label'       => 'Foto Persiapan Crane & Sling',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 4,
                    ],
                    [
                        'field_key'   => 'foto_berthing_pelindo',
                        'field_name'  => 'foto_berthing_pelindo',
                        'label'       => 'Foto Sandar Pelindo',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 5,
                    ],
                    [
                        'field_key'   => 'foto_discharge_port',
                        'field_name'  => 'foto_discharge_port',
                        'label'       => 'Foto Bongkar Pelabuhan',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 6,
                    ],
                    [
                        'field_key'   => 'foto_cargo_temporary_storage',
                        'field_name'  => 'foto_cargo_temporary_storage',
                        'label'       => 'Foto Cargo di Area Penumpukan',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 7,
                    ],
                ],
            ],

            // STEP 3 — TRUCKING / DARAT
            [
                'checkpoint_name' => 'Pelabuhan',
                'name' => 'Laporan Trucking (Transport Darat)',
                'description' => 'Requirement laporan pemuatan kargo ke armada truk darat',
                'applies_to_report_type' => ReportType::Movement,
                'fields' => [
                    [
                        'field_key'   => 'license_plate',
                        'field_name'  => 'license_plate',
                        'label'       => 'Plat Nomor',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 1,
                    ],
                    [
                        'field_key'   => 'driver_name',
                        'field_name'  => 'driver_name',
                        'label'       => 'Nama Supir',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 2,
                    ],
                    [
                        'field_key'   => 'packing_list_item',
                        'field_name'  => 'packing_list_item',
                        'label'       => 'Pilih Item Packing List',
                        'field_type'  => 'dropdown',
                        'required'    => true,
                        'options'     => null, // Dynamic runtime options from assignment cargo
                        'sort_order'  => 3,
                    ],
                    [
                        'field_key'   => 'foto_truk_depan',
                        'field_name'  => 'foto_truk_depan',
                        'label'       => 'Foto Truk Depan (Plat Nomor)',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 4,
                    ],
                    [
                        'field_key'   => 'foto_truk_samping',
                        'field_name'  => 'foto_truk_samping',
                        'label'       => 'Foto Truk Samping (Muatan)',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 5,
                    ],
                    [
                        'field_key'   => 'foto_sim_supir',
                        'field_name'  => 'foto_sim_supir',
                        'label'       => 'Foto SIM Supir',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 6,
                    ],
                    [
                        'field_key'   => 'foto_stnk_truk',
                        'field_name'  => 'foto_stnk_truk',
                        'label'       => 'Foto STNK Truk',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 7,
                    ],
                    [
                        'field_key'   => 'foto_lashing_truk',
                        'field_name'  => 'foto_lashing_truk',
                        'label'       => 'Foto Lashing Truk',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 8,
                    ],
                    [
                        'field_key'   => 'foto_truk_berangkat',
                        'field_name'  => 'foto_truk_berangkat',
                        'label'       => 'Foto Truk Berangkat',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 9,
                    ],
                    [
                        'field_key'   => 'foto_surat_jalan',
                        'field_name'  => 'foto_surat_jalan',
                        'label'       => 'Foto Surat Jalan',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 10,
                    ],
                ],
            ],

            // STEP 4 — SITE
            [
                'checkpoint_name' => 'Site',
                'name' => 'Laporan Site (Penerimaan & POD)',
                'description' => 'Requirement laporan penerimaan kargo dan Proof of Delivery di lokasi Site',
                'applies_to_report_type' => ReportType::Final,
                'fields' => [
                    [
                        'field_key'   => 'nama_penerima_site',
                        'field_name'  => 'nama_penerima_site',
                        'label'       => 'Nama Penerima Site',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 1,
                    ],
                    [
                        'field_key'   => 'kondisi_barang',
                        'field_name'  => 'kondisi_barang',
                        'label'       => 'Kondisi Barang',
                        'field_type'  => 'text',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 2,
                    ],
                    [
                        'field_key'   => 'foto_surat_jalan_ttd_cap',
                        'field_name'  => 'foto_surat_jalan_ttd_cap',
                        'label'       => 'Foto Surat Jalan TTD & Cap',
                        'field_type'  => 'photo',
                        'required'    => true,
                        'options'     => null,
                        'sort_order'  => 3,
                    ],
                ],
            ],
        ];

        DB::transaction(function () use ($templateDefinitions) {
            foreach ($templateDefinitions as $def) {
                $checkpoint = Checkpoint::where('name', $def['checkpoint_name'])->first();
                if (!$checkpoint) {
                    continue;
                }

                $template = ReportTemplate::updateOrCreate(
                    [
                        'checkpoint_id' => $checkpoint->id,
                        'name'          => $def['name'],
                    ],
                    [
                        'description'            => $def['description'],
                        'applies_to_report_type' => $def['applies_to_report_type'],
                    ]
                );

                foreach ($def['fields'] as $field) {
                    TemplateField::updateOrCreate(
                        [
                            'template_id' => $template->id,
                            'field_key'   => $field['field_key'],
                        ],
                        [
                            'field_name' => $field['field_name'],
                            'label'      => $field['label'],
                            'field_type' => $field['field_type'],
                            'required'   => $field['required'],
                            'options'    => $field['options'],
                            'sort_order' => $field['sort_order'],
                        ]
                    );
                }
            }
        });
    }
}
