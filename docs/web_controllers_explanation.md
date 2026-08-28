# Dokumentasi Controller Bagian Web (GTD-MOVLOG-WEB)

Dokumen ini berisi penjelasan komprehensif mengenai seluruh **Web Controller** pada proyek **GTD-MOVLOG-WEB**. Controller web bertanggung jawab untuk menangani permintaan HTTP dari antarmuka web yang dibangun menggunakan kombinasi **Laravel** dan **Inertia.js**.

---

## 1. Arsitektur & Pola Desain Web Controller

Seluruh controller khusus bagian web terletak pada direktori `app/Http/Controllers/Web/`. 

Secara umum, arsitektur yang digunakan menerapkan beberapa pola berikut:
- **Inertia.js Response Layer**: Controller tidak mengembalikan tampilan Blade tradisional, melainkan merender komponen UI React/Vue melalui `Inertia::render('NamaKomponen', $data)`.
- **Thin Controller Pattern**: Controller bertindak sebagai *orchestrator*. Logika bisnis utama (misalnya pembuatan user, pembaruan data, penghapusan, dan enkapsulasi aturan bisnis) diisolasi di *Service Layer* (`App\Services\UserService`) dan menggunakan *Data Transfer Objects* (`App\DTOs\UserDTO`).
- **Authorization & Security**: Menggunakan Laravel `Gate` dan `Policy` (misal `Gate::authorize()`) untuk memvalidasi hak akses pengguna, serta menyertakan proteksi *self-deactivation safeguard* (mencegah pengguna menonaktifkan akunnya sendiri).
- **Session-Based Authentication**: Pengelolaan otentikasi login/logout web menggunakan Laravel Session (`Auth::guard('web')`).

---

## 2. Ringkasan Controller Web

| No | Nama Controller | Sub-Namespace | Deskripsi Utama |
|---|---|---|---|
| 1 | `AuthenticatedSessionController` | `Web\Auth` | Menangani proses login dan logout pengguna berbasis sesi. |
| 2 | `RegisteredUserController` | `Web\Auth` | Menangani pendaftaran (*registration*) pengguna baru pada web admin. |
| 3 | `KelolaAkunController` | `Web` | Fitur manajemen akun untuk Super Admin (list, filter, stats, toggle status, tambah). |
| 4 | `UserController` | `Web` | Controller CRUD standar manajemen pengguna dengan otorisasi Gate & UserService. |
| 5 | `SubmitBerkasController` | `Web` | Alur penyerahan dokumen/berkas (wizard), finalisasi pengajuan, dan cek status. |
| 6 | `VerifikasiBerkasController` | `Web` | Halaman verifikasi dokumen pengiriman untuk peran Supervisor. |
| 7 | `MonitoringBarangController` | `Web` | Halaman pemantauan status dan pergerakan kargo/barang. |
| 8 | `SesiPekerjaController` | `Web` | Manajemen sesi kerja alat berat & pantauan progres logistik (Super Admin). |
| 9 | `LaporanController` | `Web` | Halaman pelaporan dan rekapitulasi data operasional. |

---

## 3. Penjelasan Detail Setiap Controller

### 3.1. Auth Sub-namespace (`app/Http/Controllers/Web/Auth/`)

#### 1. `AuthenticatedSessionController.php`
- **File**: `app/Http/Controllers/Web/Auth/AuthenticatedSessionController.php`
- **Namespace**: `App\Http\Controllers\Web\Auth`
- **Fungsi Utama**: Menangani alur masuk (*login*) dan keluar (*logout*) pengguna antarmuka web admin.
- **Method & Cara Kerja**:
  - `store(Request $request): RedirectResponse`
    - Memvalidasi kredensial `email` dan `password`.
    - Melakukan otentikasi dengan `Auth::attempt()`.
    - **Pengecekan Akun Aktif**: Jika kredensial benar tetapi status akun pengguna **tidak aktif** (`!$user->isActive()`), controller akan otomatis melakukan logout, menghapus sesi (`session()->invalidate()`), dan melempar `ValidationException` dengan pesan bahwa akun dinonaktifkan.
    - Jika aktif, sesi diregenerasi (`session()->regenerate()`) dan pengguna di-redirect ke `dashboard`.
  - `destroy(Request $request): RedirectResponse`
    - Melakukan logout dari guard `web`.
    - Membatalkan sesi pengguna dan meregenerasi CSRF token.
    - Mengarahkan kembali ke halaman `login`.

---

#### 2. `RegisteredUserController.php`
- **File**: `app/Http/Controllers/Web/Auth/RegisteredUserController.php`
- **Namespace**: `App\Http\Controllers\Web\Auth`
- **Fungsi Utama**: Menangani pendaftaran akun pengguna baru dari antarmuka web.
- **Method & Cara Kerja**:
  - `store(Request $request): RedirectResponse`
    - Memvalidasi input registrasi: `name`, `email` (harus unik di tabel `users`), `password` (minimal 8 karakter, wajib memiliki kombinasi huruf kapital, angka, dan simbol), serta persetujuan `terms`.
    - Menyimpan user baru ke database dengan password di-hash (`Hash::make`).
    - Memicu event Laravel `Registered($user)`.
    - Melakukan auto-login via `Auth::login($user)` dan mengarahkan pengguna ke halaman `dashboard`.

---

### 3.2. Management Controllers (`app/Http/Controllers/Web/`)

#### 3. `KelolaAkunController.php`
- **File**: `app/Http/Controllers/Web/KelolaAkunController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Menyajikan halaman dan aksi pengelolaan akun pengguna khusus untuk peran **Super Admin**, dilengkapi statistik pengguna real-time, pencarian, dan filter multi-kriteria.
- **Method & Cara Kerja**:
  - `index(Request $request): Response`
    - Memuat daftar pengguna terpaginasi (default 5 item/halaman) beserta relasi `roles`.
    - Fitur pencarian kata kunci (*case-insensitive*) pada nama/email.
    - Filter berdasarkan peran (*role*) dan status akun (aktif/tidak aktif).
    - Menghitung statistik pengguna: Total Pengguna, Pengguna Baru Bulan Ini, Admin Internal, Customer, dan Akun Nonaktif.
    - Merender komponen Inertia `KelolaAkun/Index`.
  - `toggleStatus(Request $request, User $user)`
    - Memperbarui status akun pengguna menjadi `active` atau `inactive`.
    - **Proteksi Bisnis**: Menolak aksi jika pengguna mencoba menonaktifkan akunnya sendiri.
  - `create(): Response`
    - Merender halaman form `KelolaAkun/TambahAkun` dengan daftar peran yang tersedia dari Enum `UserRole`.
  - `store(StoreUserRequest $request): RedirectResponse`
    - Membuat pengguna baru melalui `UserService::create()` menggunakan data yang telah divalidasi dan diubah ke `UserDTO`.

---

#### 4. `UserController.php`
- **File**: `app/Http/Controllers/Web/UserController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Controller CRUD standar manajemen pengguna untuk Admin Dashboard dengan menerapkan *Thin Controller Pattern* dan otorisasi berbasis Laravel Policy/Gate.
- **Method & Cara Kerja**:
  - `index(): Response`: Otorisasi `viewAny` -> mengambil daftar pengguna terpaginasi via `UserService::list()` -> render `Users/Index`.
  - `create(): Response`: Otorisasi `create` -> render form `Users/Create`.
  - `store(StoreUserRequest $request): RedirectResponse`: Menyimpan pengguna via `UserService::create()` -> redirect ke `users.index`.
  - `show(string $user): Response`: Ambil data user -> otorisasi `view` -> render `Users/Show`.
  - `edit(string $user): Response`: Ambil data user -> otorisasi `update` -> render `Users/Edit`.
  - `update(UpdateUserRequest $request, string $user): RedirectResponse`: Memperbarui data pengguna via `UserService::update()`.
  - `destroy(string $user)`: Menghapus pengguna dengan otorisasi `delete`. Mendukung *hybrid response* (merespons dengan JSON 404/403/422/500 jika dipanggil via API non-Inertia, atau redirect kembali dengan pesan flash error/success).

---

### 3.3. Operational & Logistics Controllers (`app/Http/Controllers/Web/`)

#### 5. `SubmitBerkasController.php`
- **File**: `app/Http/Controllers/Web/SubmitBerkasController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Menangani alur penyerahan dokumen/berkas operasional logistik oleh pengguna.
- **Method & Cara Kerja**:
  - `index(): Response`: Merender komponen Inertia `SubmitBerkas/SubmitBerkas` (wizard formulir penyerahan berkas).
  - `finalize(Request $request)`: Membuat record `Submission` baru di database dengan status `pending`, mencatat ID pengunggah (`auth()->id()`), payload data berkas, dan waktu pengajuan, lalu redirect ke halaman status berkas.
  - `status(Submission $submission)`: Merender komponen Inertia `SubmitBerkas/Status` yang menampilkan detail status pengajuan, tanggal submit, alasan penolakan (jika ada), dan payload data.

---

#### 6. `VerifikasiBerkasController.php`
- **File**: `app/Http/Controllers/Web/VerifikasiBerkasController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Menangani halaman verifikasi dokumen pengiriman khusus untuk peran **Supervisor** sebelum dokumen disetujui untuk operasional.
- **Method & Cara Kerja**:
  - `index(Request $request): Response`: Merender komponen Inertia `VerifikasiBerkas/Index`.

---

#### 7. `MonitoringBarangController.php`
- **File**: `app/Http/Controllers/Web/MonitoringBarangController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Menyajikan antarmuka pemantauan (*monitoring*) status pergerakan barang dan kargo logistik.
- **Method & Cara Kerja**:
  - `index(): Response`: Merender komponen Inertia `MonitoringBarang/MonitoringBarang`.

---

#### 8. `SesiPekerjaController.php`
- **File**: `app/Http/Controllers/Web/SesiPekerjaController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Digunakan oleh Super Admin untuk mengelola sesi kerja operator alat berat dan memantau progres logistik sebelum memasuki tahap pemantauan *checkpoint*.
- **Method & Cara Kerja**:
  - `index(Request $request): Response`: Merender halaman `KelolaSesi/Index`.
  - `create(Request $request): Response`: Merender halaman form pembuatan sesi baru `KelolaSesi/Create`.

---

#### 9. `LaporanController.php`
- **File**: `app/Http/Controllers/Web/LaporanController.php`
- **Namespace**: `App\Http\Controllers\Web`
- **Fungsi Utama**: Menyajikan halaman laporan operasional dan statistik logistik pada web admin.
- **Method & Cara Kerja**:
  - `index(): Response`: Merender komponen Inertia `Laporan/Laporan`.

---

## 4. Pemetaan Route ke Web Controller (`routes/web.php`)

Berikut adalah ringkasan bagaimana controller web di atas dihubungkan dalam file rute `routes/web.php`:

| Route Method | URI / Pattern | Controller & Method | Middleware |
|---|---|---|---|
| `POST` | `/login` | `AuthenticatedSessionController@store` | `guest` |
| `POST` | `/register` | `RegisteredUserController@store` | `guest` |
| `POST` | `/logout` | `AuthenticatedSessionController@destroy` | `auth, verified` |
| `RESOURCE` | `/users` | `UserController` (index, create, store, show, edit, update, destroy) | `auth, verified` |
| `GET` | `/monitoring-barang` | `MonitoringBarangController@index` | `auth, verified` |
| `GET` | `/laporan` | `LaporanController@index` | `auth, verified` |
| `GET` | `/submit-dokumen` | `SubmitBerkasController@index` | `auth, verified` |
| `POST` | `/submit-berkas/finalize` | `SubmitBerkasController@finalize` | `auth, verified` |
| `GET` | `/submit-berkas/status/{submission}` | `SubmitBerkasController@status` | `auth, verified` |

---
*Dokumen ini dibuat otomatis sebagai panduan arsitektur controller web proyek GTD-MOVLOG-WEB.*
