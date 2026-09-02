import { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

interface ProcessStep {
    number: string;
    title: string;
    description: string;
    details: string[];
}

interface RoleSop {
    roleId: string;
    roleName: string;
    description: string;
    steps: ProcessStep[];
}

const sopData: RoleSop[] = [
    {
        roleId: 'field-worker',
        roleName: 'Staf Lapangan / Worker',
        description: 'Prosedur standar pengoperasian sesi kerja dan pembaruan status checkpoint di area kargo/pelabuhan.',
        steps: [
            {
                number: '01',
                title: 'Absensi & Inisiasi Sesi Pekerja',
                description: 'Memulai sesi tugas harian sebelum melakukan pemeriksaan kargo.',
                details: [
                    'Buka menu Worker Sessions dari navigasi utama.',
                    'Pilih unit tugas dan konfirmasi lokasi awal keberadaan.',
                    'Klik "Mulai Sesi Pekerja" untuk mencatat timestamp awal kerja secara otomatis.',
                ],
            },
            {
                number: '02',
                title: 'Pemeriksaan Kondisi Fisik Kargo & Checkpoint',
                description: 'Melakukan verifikasi fisik kontainer atau unit kendaraan di lapangan.',
                details: [
                    'Buka modul Checkpoint Monitoring pada sistem.',
                    'Pastikan status segel, nomor seri kontainer, dan kargo sesuai manifest.',
                    'Perbarui status ke "Lolos Checkpoint" apabila seluruh kondisi memenuhi syarat.',
                ],
            },
            {
                number: '03',
                title: 'Pencatatan Kendala Lapangan (Jika Ada)',
                description: 'Melaporkan secara langsung apabila ditemukan ketidaksesuaian barang atau kendala fisik.',
                details: [
                    'Pilih menu Tambah Catatan Kendala pada checkpoint terkait.',
                    'Tuliskan uraian kendala fisik secara singkat dan jelas.',
                    'Sistem akan otomatis mengirimkan notifikasi alert kepada Supervisor bertugas.',
                ],
            },
            {
                number: '04',
                title: 'Finalisasi Sesi Kerja',
                description: 'Menutup sesi tugas setelah seluruh unit kargo diselesaikan.',
                details: [
                    'Pastikan seluruh checkpoint pada sesi terkait berstatus Selesai.',
                    'Klik tombol "Selesaikan Sesi" di bagian atas halaman detail sesi.',
                ],
            },
        ],
    },
    {
        roleId: 'staff-admin',
        roleName: 'Staf Administrasi & Dokumen',
        description: 'Prosedur entri data kargo, pengunggahan berkas pabean/PIB, dan kelengkapan lampiran.',
        steps: [
            {
                number: '01',
                title: 'Inisiasi Pengiriman & Registrasi Pelanggan',
                description: 'Mendaftarkan data pelanggan dan referensi pengiriman baru.',
                details: [
                    'Akses modul Submit Documents pada sidebar.',
                    'Pilih nama pelanggan terdaftar atau tambahkan profil pelanggan baru.',
                    'Masukkan nomor kontrak/ref pengiriman utama sebagai pengenal transaksi.',
                ],
            },
            {
                number: '02',
                title: 'Pengunggahan Berkas Utama (PIB / Manifest / Bill of Lading)',
                description: 'Mengunggah berkas pendukung resmi dalam format PDF standar.',
                details: [
                    'Pilih tahapan dokumen yang akan diunggah pada Wizard Submit Berkas.',
                    'Pastikan ukuran berkas tidak melebihi 10MB per dokumen.',
                    'Periksa kembali kecocokan nomor dokumen sebelum menekan tombol Simpan.',
                ],
            },
            {
                number: '03',
                title: 'Pengiriman Berkas ke Antrean Verifikasi',
                description: 'Mengajukan dokumen lengkap kepada Supervisor untuk diperiksa.',
                details: [
                    'Setelah seluruh dokumen tahap wajib terisi, periksa ringkasan berkas.',
                    'Klik "Finalisasi & Ajukan Verifikasi". Status berkas berubah menjadi Pending Verification.',
                ],
            },
        ],
    },
    {
        roleId: 'supervisor',
        roleName: 'Supervisor',
        description: 'Prosedur pemeriksaan akurasi dokumen, persetujuan (approval), dan penerbitan laporan.',
        steps: [
            {
                number: '01',
                title: 'Pemeriksaan Antrean Dokumen Masuk',
                description: 'Memantau daftar pengajuan berkas dari staf administrasi.',
                details: [
                    'Buka modul Verify Documents dari navigasi sidebar.',
                    'Filter daftar dokumen berdasarkan status Pending Verification.',
                    'Klik pada baris nomor pengajuan untuk membuka lembar pemeriksaan berkas.',
                ],
            },
            {
                number: '02',
                title: 'Validasi & Uji Kesesuaian Data',
                description: 'Membandingkan isi dokumen fisik/digital dengan parameter sistem.',
                details: [
                    'Buka pratinjau dokumen menggunakan PDF Viewer terintegrasi.',
                    'Cocokkan jumlah barang, nilai pabean, dan identitas pengirim.',
                ],
            },
            {
                number: '03',
                title: 'Eksekusi Persetujuan atau Penolakan Dokumen',
                description: 'Menentukan keputusan hasil pemeriksaan berkas.',
                details: [
                    'Klik "Verifikasi & Setujui" jika seluruh dokumen telah valid.',
                    'Jika terdapat kekeliruan, pilih "Tolak / Minta Revisi" dan wajib mengisikan alasan penolakan secara spesifik.',
                ],
            },
            {
                number: '04',
                title: 'Generasi Laporan Operasional',
                description: 'Mengunduh laporan rekapitulasi berkas dan kargo.',
                details: [
                    'Akses modul Reports.',
                    'Tentukan rentang tanggal laporan yang diinginkan dan pilih format ekspor (PDF / Excel).',
                ],
            },
        ],
    },
    {
        roleId: 'super-admin',
        roleName: 'Super Admin',
        description: 'Prosedur tata kelola akun pengguna, penetapan peran (role), dan konfigurasi hak akses.',
        steps: [
            {
                number: '01',
                title: 'Manajemen Akun Pengguna Baru',
                description: 'Mendaftarkan personel operasional ke dalam sistem GTD.',
                details: [
                    'Akses modul Account Management.',
                    'Klik "Tambah Akun Pengguna Baru".',
                    'Isikan NIK/NIP, Nama Lengkap, Alamat Email, dan tentukan Role (Staf, Supervisor, Worker).',
                ],
            },
            {
                number: '02',
                title: 'Pengaturan Status & Pembekuan Akses',
                description: 'Mengatur status aktif/nonaktif akun staf.',
                details: [
                    'Gunakan tombol sakelar status aktif pada tabel akun pengguna.',
                    'Akun yang dinonaktifkan secara otomatis tidak dapat melakukan autentikasi login.',
                ],
            },
        ],
    },
];

export default function SystemGuide() {
    const [activeRole, setActiveRole] = useState('field-worker');

    const currentSop = sopData.find((s) => s.roleId === activeRole) || sopData[0];

    return (
        <DashboardLayout title="System Guide - GTD Logistics">
            <Head title="System Guide - GTD Logistics" />

            <div className="max-w-5xl mx-auto space-y-10 pb-12">
                {/* -- Header -- */}
                <div className="text-center space-y-3 pt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                        Standard Operating Procedure (SOP)
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Panduan Resmi Pengoperasian Sistem GTD
                    </h1>
                    <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                        Dokumentasi langkah demi langkah alur kerja operasional logistik berdasarkan peranan tugas pengguna.
                    </p>
                </div>

                {/* -- Role Selection Tabs -- */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {sopData.map((sop) => (
                        <button
                            key={sop.roleId}
                            type="button"
                            onClick={() => setActiveRole(sop.roleId)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                activeRole === sop.roleId
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            {sop.roleName}
                        </button>
                    ))}
                </div>

                {/* -- Active Role Description Card -- */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                            Modul Operational Guide
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 mt-1">{currentSop.roleName}</h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentSop.description}</p>
                    </div>

                    {/* -- Numbered Process Flow (01, 02, 03, 04) -- */}
                    <div className="space-y-6">
                        {currentSop.steps.map((step) => (
                            <div
                                key={step.number}
                                className="relative p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex flex-col sm:flex-row items-start gap-5 transition-all hover:bg-slate-50"
                            >
                                {/* Step Number Badge */}
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base tracking-tight shrink-0 shadow-xs">
                                    {step.number}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {step.description}
                                    </p>

                                    {/* Detailed Checklist Bullets */}
                                    <ul className="pt-2 space-y-1.5 border-t border-slate-200/60 text-xs text-slate-600">
                                        {step.details.map((detail, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* -- Clean Summary Note Footer -- */}
                <div className="p-6 rounded-3xl bg-slate-100/80 border border-slate-200/80 text-center space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Kepatuhan Standar Mutu Operasional GTD
                    </h4>
                    <p className="text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Seluruh proses wajib dilaksanakan sesuai tahapan di atas guna menjamin integritas data audit logistik, akurasi pabean, dan keamanan kargo secara menyeluruh.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
