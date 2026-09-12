# Laporan Audit Menyeluruh: GTD-MoveLog

**Tanggal Audit:** 11 September 2026  
**Aplikasi:** GTD-MoveLog (Logistics Management System)  
**Stack:** Laravel 12 + Inertia.js + React (TypeScript) + Tailwind CSS v4 + PostgreSQL 17 + Redis 7 (Docker)  
**Role Management:** Spatie Laravel Permission  
**Arsitektur Target:** Layered Architecture — *Controller → Form Request → Service → Repository → Model*

---

## 1. Executive Summary

Audit komprehensif ini dilakukan terhadap seluruh lapisan sistem **GTD-MoveLog**, meliputi aspek Fungsional, Validasi & Error Handling, Hak Akses & Permission, Frontend UI & TypeScript, Database & Query Performance, serta Konfigurasi Docker / Environment.

Secara umum fondasi sistem telah berjalan dengan baik, mencakup pemisahan modul operasional, autentikasi berbasis session/Sanctum, serta migrasi ERD yang lengkap. Namun demikian, audit mendeteksi **sejumlah temuan kritis** yang berpotensi menimbulkan *unhandled 500 error*, celah keamanan *CSRF* & *Broken Access Control*, *data invisibility/leakage* pada portal customer, serta pemborosan query (*N+1 problem*) yang signifikan.

### Distribusi Temuan Berdasarkan Severity
| Severity | Jumlah | Fokus Masalah |
|---|:---:|---|
| 🔴 **Critical** | 1 | Fatal Error 500 pada `UserPolicy` akibat pemanggilan enum non-existent |
| 🟠 **High** | 6 | Bypass CSRF token, Broken Access Control rute internal, pelanggaran arsitektur Controller-Model, string `"null"` pada form wizard, mock fallback UI Kelola Akun, ketiadaan symlink storage |
| 🟡 **Medium** | 7 | Mismatch middleware vs controller authorization, scoping query dokumen customer, validasi tipe dokumen verifikasi, 18 TypeScript compilation error, N+1 query, sensitivitas path Linux pada testing, Vite HMR polling di Docker |
| 🟢 **Low** | 2 | WebSocket error spam di console browser, ketiadaan database index pada kolom `status` |
| **Total** | **16** | |

---

## 2. Tabel Temuan Audit (Master Findings)

Format tabel: `[Area | Deskripsi Bug | Severity | Langkah Reproduksi | Saran Perbaikan]`

| Area | Deskripsi Bug | Severity | Langkah Reproduksi | Saran Perbaikan |
| :--- | :--- | :---: | :--- | :--- |
| **3. PERMISSION & ROLE** | **Fatal Crash 500 pada Akses User oleh Non-SuperAdmin (`UserPolicy`)**<br>`UserPolicy.php` memanggil `UserRole::Admin->value` dan `UserRole::Manager->value`. Konstanta `Admin` dan `Manager` tidak terdefinisi pada enum `UserRole` (hanya ada `SuperAdmin`, `Supervisor`, `Staff`, `FieldWorker`, `Customer`). | 🔴 **Critical** | 1. Login sebagai `staff@lms.local` atau `supervisor@lms.local`.<br>2. Buka URL `/users` atau panggil API `GET /api/v1/users`.<br>3. `UserPolicy::viewAny` dievaluasi, memicu fatal error: `Error: Undefined constant App\Enums\UserRole::Admin` (HTTP 500). | Perbarui `app/Policies/UserPolicy.php` agar hanya mengevaluasi case yang ada pada `UserRole` (`SuperAdmin`, `Staff`, dll.) atau gunakan pengecekan Spatie `$user->hasRole(...)`. |
| **2. VALIDASI & SECURITY** | **CSRF Protection Dinonaktifkan pada Mutasi Status Akun**<br>Di `bootstrap/app.php`, endpoint `kelola-akun/*/status` dikecualikan secara eksplisit dari verifikasi token CSRF (`validateCsrfTokens(except: ['kelola-akun/*/status'])`). | 🟠 **High** | 1. Admin login ke sistem.<br>2. Buka halaman eksternal yang memicu request `PATCH /kelola-akun/{targetUserId}/status` dengan payload status tanpa CSRF token.<br>3. Akun berhasil diaktifkan/dinonaktifkan tanpa validasi token. | Hapus `'kelola-akun/*/status'` dari daftar except CSRF di `bootstrap/app.php`. Pastikan Inertia `router.patch` menyertakan token CSRF standar. |
| **3. PERMISSION & ROLE** | **Broken Access Control pada Manajemen User & Operasi Sesi Pekerja**<br>Di `routes/web.php`, resource route `Route::resource('users', UserController::class)` dan seluruh rute mutasi sesi (`sesi-pekerja/{session}/assign-all`, `stages/{stage}/complete`, `movements`, `reports`) berada di luar middleware role. | 🟠 **High** | 1. Login sebagai user dengan role `customer` atau `field-worker`.<br>2. Akses endpoint `/users` atau kirim request mutasi ke `/sesi-pekerja/{session}/assign-all`.<br>3. Rute tidak diblokir pada tingkat route middleware. | Pindahkan `Route::resource('users', ...)` ke dalam `role:super-admin`. Bungkus rute detail dan mutasi sesi pekerja ke dalam middleware `role:super-admin\|staff`. |
| **1. FUNGSIONAL & ARSITEKTUR** | **Pelanggaran Arsitektur Berlapis (Bypass Form Request, Service & Repository)**<br>Beberapa controller web melakukan query Eloquent langsung, mutasi model, dan validasi inline via `$request->validate()`:<br>• `SubmitBerkasController`: `storeCustomer()`, `index()`, upload file di `saveStep()`.<br>• `VerifikasiBerkasController`: `verify()`, `reject()`, logika `maybeGenerateShippingSession()` sepanjang 60 baris.<br>• `KelolaAkunController`: `index()` bypass `UserService::list()`, `toggleStatus()` mutasi model langsung.<br>• `SesiPekerjaController`: validasi inline pada 5 method dan perakitan data 150 baris di controller. | 🟠 **High** | 1. Buka file controller terkait.<br>2. Ditemukan query `Customer::create()`, `Document::update()`, dan `$request->validate()` yang melompati Form Request & Service layer. | Ekstraksi validasi ke Form Request terdedikasi (`StoreCustomerRequest`, `VerifyDocumentRequest`, `AssignStageRequest`, dll.), pindahkan pembuatan `ShippingSession` ke Service, dan gunakan DTO/Resource untuk transformasi data. |
| **1. FUNGSIONAL & FRONTEND** | **Coercion String "null" pada Step Form Wizard Submit Berkas**<br>Pada `CertificateOfOriginStep.tsx`, `CommercialInvoiceStep.tsx`, `InsuranceStep.tsx`, dan `PackingListStep.tsx`, pemanggilan `formData.append('assignment_no_ref', assignmentNoRef)` menerima `string \| null`. Jika null, FormData mengubah nilai menjadi string literal `"null"`. | 🟠 **High** | 1. Buka `/submit-berkas`.<br>2. Jika terjadi jeda inisialisasi customer atau state belum terisi, simpan step dokumen.<br>3. Dokumen tersimpan di database dengan `assignment_no_ref = "null"`. | Berikan guard: jika `!assignmentNoRef`, cegah submit dan tampilkan alert. Tambahkan validasi regex di backend `SaveDocumentStepRequest` agar menolak nilai `"null"`. |
| **4. FRONTEND / UI** | **Fallback Data Mock Seeder Saat Hasil Pencarian Kelola Akun Kosong**<br>Di `KelolaAkun/Index.tsx` baris 68, kondisi didefinisikan: `const hasServerData = users && Array.isArray(users.data) && users.data.length > 0;`. Jika pencarian menghasilkan 0 user, `hasServerData` bernilai `false`, dan UI me-render `seederUsers` (data dummy mock lokal). | 🟠 **High** | 1. Buka `/kelola-akun`.<br>2. Ketik kata kunci yang tidak ada di database (misal: `kata_kunci_acak_123`).<br>3. Server mengembalikan `users.data = []`.<br>4. UI tidak menampilkan "Data tidak ditemukan", melainkan menampilkan daftar user dummy seeder. | Ubah pengecekan menjadi `Boolean(users && Array.isArray(users.data))`. Tampilkan pesan *empty state* yang benar saat `users.data.length === 0`. |
| **6. DOCKER & ENV** | **Storage Symlink Belum Dibuat (`public/storage`)**<br>Symlink `public/storage` belum dibuat (`ls public/storage` menghasilkan `No such file or directory`). Seluruh file PDF atau avatar yang diunggah dan diakses via URL publik `/storage/...` akan mengembalikan 404 Not Found. | 🟠 **High** | 1. Unggah berkas dokumen di Submit Berkas atau avatar profil.<br>2. Buka URL file yang dihasilkan (`/storage/pdf_dokumen/...`).<br>3. Server web Nginx mengembalikan error 404. | Jalankan `php artisan storage:link` di dalam container `lms_app` dan sertakan pada Dockerfile / entrypoint startup. |
| **3. PERMISSION & ROLE** | **Mismatch Middleware vs Controller Authorization pada Template Laporan**<br>Rute `template-laporan` diletakkan di dalam `Route::middleware('role:super-admin\|staff')`, namun `ReportTemplateController::authorizeSuperAdmin()` memblokir role `staff` dengan `403 Forbidden`. | 🟡 **Medium** | 1. Login sebagai `staff@lms.local`.<br>2. Buka URL `/template-laporan`.<br>3. Middleware mengizinkan akses, namun controller langsung memicu error 403. | Pindahkan resource rute `template-laporan` ke dalam grup `Route::middleware('role:super-admin')`. |
| **1. FUNGSIONAL** | **Data Invisibility pada Global Search Dokumen Milik Customer**<br>Di `GlobalSearchService::searchDokumen()`, filter role customer menggunakan `whereHas('shippingSession', fn($q) => $q->where('customer_id', $customer->id))`. Dokumen yang baru diajukan belum memiliki `shipping_session_id` (masih `NULL` sebelum diverifikasi 5/5 oleh supervisor). Customer tidak dapat menemukan berkas miliknya di pencarian global. | 🟡 **Medium** | 1. Login sebagai customer.<br>2. Ajukan berkas di `/submit-berkas` (status Draft/Pending).<br>3. Cari nama berkas via Global Search navbar.<br>4. Berkas tidak ditemukan (0 hasil). | Ubah filter di `searchDokumen` menjadi `$query->where('customer_id', $customer->id)` langsung pada tabel `documents`. |
| **1. FUNGSIONAL** | **Verifikasi Berkas Tidak Memvalidasi 5 Tipe Dokumen Unik**<br>Di `VerifikasiBerkasController::maybeGenerateShippingSession()`, pengecekan kelengkapan hanya menghitung `$documents->count() === 5`. Jika terdapat tipe duplikat (misal 2 BL dan 0 Insurance), sistem tetap menganggap lengkap dan membuat sesi pengiriman tanpa Asuransi. | 🟡 **Medium** | 1. Submit assignment dengan dokumen duplikat (total tetap 5 berkas, tanpa asuransi).<br>2. Supervisor memverifikasi seluruh 5 dokumen.<br>3. Shipping session berhasil dibuat tanpa validasi kelengkapan tipe unik. | Validasi kumpulan `document_type_id` unik terhadap kumpulan ID wajib `[1, 2, 3, 4, 5]` seperti pada `DocumentSubmissionService::assertComplete()`. |
| **4. FRONTEND / UI** | **18 TypeScript Compilation Errors (`npx tsc --noEmit`)**<br>Pemeriksaan tipe mendeteksi 18 error statik:<br>• `DetailBarangDrawer.tsx`: perbandingan `DocumentStatus` dengan `'Approved'` / `'Rejected'` (tipe frontend bertuliskan Indonesia `'Disetujui'`, sedangkan backend mengembalikan Inggris).<br>• `StatusBadge.tsx`: properti `'Pending Verification'` belum terdaftar.<br>• `laporanConstants.ts`: casing `'Ready'` vs `'ready'`, `'Expired'` vs `'expired'`.<br>• Argumen `string \| null` pada `FormData.append` di 4 file step form. | 🟡 **Medium** | 1. Jalankan `npx tsc --noEmit` di terminal.<br>2. Muncul 18 daftar error kompilasi TypeScript. | Selaraskan definisi tipe di `types/monitoringBarang.ts` dengan response backend, perbaiki casing pada `laporanConstants.ts`, dan berikan fallback string pada `FormData.append`. |
| **4. FRONTEND / UI** | **Input Search Kelola Akun Tanpa Debounce**<br>Di `KelolaAkun/Index.tsx`, setiap karakter yang diketik langsung mengeksekusi `router.get('/kelola-akun', ...)` tanpa penundaan (debounce). | 🟡 **Medium** | 1. Buka `/kelola-akun`.<br>2. Ketik nama cepat di kolom pencarian.<br>3. Puluhan HTTP GET request terkirim sekaligus, memicu race condition respons jaringan. | Terapkan hook `useDebounce` (300-500ms) sebelum memanggil `router.get`. |
| **5. PERFORMA & QUERY** | **Query N+1 Parah pada Halaman Monitoring Barang**<br>Di `MonitoringBarangService::getMonitoringItems()`, di dalam perulangan `map()` dari seluruh assignment dokumen:<br>• Dijalankan query `ShippingSession::where('assignment_no', ...)->with([...])->first()`.<br>• Dijalankan query `Checkpoint::orderBy('sequence')->get()` berulang kali di setiap baris. | 🟡 **Medium** | 1. Buka halaman `/monitoring-barang` dengan 50 assignment.<br>2. Backend mengeksekusi lebih dari 100 query SQL individual alih-alih 2 batch query. | Pindahkan query `Checkpoint::all()` ke luar perulangan. Eager load batch `ShippingSession` menggunakan `whereIn('assignment_no', $assignmentRefs)`. |
| **5. PERFORMA & QUERY** | **Query N+1 pada Detail Monitoring Checkpoint & Report Template**<br>• Di `MonitoringCheckpointController::show()`, di dalam loop checkpoint dan movement, query `Report::where(...)->with([...])->first()` dieksekusi per armada per checkpoint.<br>• Di `ReportTemplateController::index()`, loop template mengeksekusi query `Report::exists()` dan `SessionCheckpoint::whereRaw(...)` satu per satu. | 🟡 **Medium** | 1. Buka `/monitoring-checkpoint/{assignmentNo}` pada pengiriman dengan banyak unit truk.<br>2. Jumlah query membengkak seiring bertambahnya armada dan tahapan. | Lakukan batch querying untuk reports dan kelompokkan data di memory menggunakan collection `groupBy(['session_checkpoint_id', 'movement_id'])`. |
| **5. DATABASE & TESTS** | **Kegagalan Testing Inertia karena Sensitivitas Huruf Besar/Kecil Linux**<br>Konfigurasi `vendor/inertiajs/inertia-laravel/config/inertia.php` mencari path `resource_path('js/pages')` (huruf kecil `pages`), sedangkan di repositori foldernya bernama `resources/js/Pages` (huruf kapital `P`). Pada Linux/Docker, test `ReportTemplateManagementTest` gagal mencari komponen. | 🟡 **Medium** | 1. Jalankan `php artisan test tests/Feature/ReportTemplateManagementTest.php`.<br>2. Test gagal dengan error `Inertia page component file [TemplateLaporan/Index] does not exist.` | Publish konfigurasi Inertia via `php artisan vendor:publish --provider="Inertia\ServiceProvider"` dan arahkan path ke `resource_path('js/Pages')`. |
| **6. DOCKER & ENV** | **Vite HMR File Watching Tidak Mendeteksi Perubahan di Docker Mount**<br>Di `vite.config.ts`, opsi `server.watch.usePolling: true` belum diaktifkan. Pada Docker di Windows/WSL2, filesystem event inotify sering tidak terdeteksi di dalam container. | 🟡 **Medium** | 1. Jalankan dev server di container Docker.<br>2. Edit komponen React di host.<br>3. HMR tidak terpicu secara otomatis sampai container di-restart atau browser di-refresh manual. | Tambahkan opsi `watch: { usePolling: true, interval: 100 }` pada konfigurasi `server` di `vite.config.ts`. |
| **4. FRONTEND / UI** | **Spam WebSocket Error di Console Browser**<br>`useRealtimeUpdates.ts` menginisialisasi Laravel Echo dengan `reverbKey = undefined` dan `wsPort = 8080` (port HTTP Nginx). Console browser dipenuhi error koneksi WebSocket gagal secara berulang. | 🟢 **Low** | 1. Buka Customer Portal dengan DevTools Console aktif.<br>2. Muncul error berulang `WebSocket connection to ws://localhost:8080/app/undefined failed`. | Tambahkan guard: jangan inisialisasi Echo jika `!reverbKey`. Sediakan konfigurasi Reverb di `.env.example`. |
| **5. DATABASE & ERD** | **Missing Index pada Kolom Status Transaksional**<br>Kolom `documents.status` dan `shipping_sessions.status` sering digunakan dalam klausa filter (`where`, `whereIn`, aggregate), namun belum memiliki index pada skema database. | 🟢 **Low** | 1. Periksa file migration `create_documents_table` dan `create_shipping_sessions_table`.<br>2. Kolom `status` tidak memiliki `$table->index('status')`. | Tambahkan index pada kolom `status` di tabel `documents` dan `shipping_sessions` via migration baru. |

---

## 3. Rincian Teknis per Area Temuan

### 3.1. Area Fungsional & Arsitektur
1. **Pelanggaran Pola Layered (Controller → Form Request → Service → Repository → Model):**
   - Pada `SubmitBerkasController`, aksi `storeCustomer()` menerima `Request $request` biasa dan melakukan validasi inline `$request->validate(...)` lalu langsung memanggil `Customer::create($validated)`.
   - Logika penentuan dan pembuatan `shipping_sessions` ditempatkan di private method `maybeGenerateShippingSession()` pada `VerifikasiBerkasController` alih-alih menjadi tanggung jawab domain service.
   - Pada `KelolaAkunController`, method `index()` langsung memanggil `User::with(...)->paginate()` dan mengabaikan method `UserService::list()`.

2. **Kesesuaian Validasi Dokumen Kepabeanan (Customs):**
   - Di `VerifikasiBerkasController`, pengecekan kelengkapan hanya memeriksa `$documents->count() === 5`. Jika customer mengunggah 2 file Commercial Invoice dan tidak ada Packing List, syarat ini secara keliru terpenuhi.

### 3.2. Area Validasi & Error Handling
1. **Unhandled Exceptions pada Web Routes:**
   - Di `bootstrap/app.php`, custom error renderer hanya aktif jika `$request->is('api/*') || $request->expectsJson()`. Permintaan web standar yang mengalami exception domain akan menampilkan halaman 500 mentah ke pengguna.
2. **Pengecualian CSRF:**
   - Rute `kelola-akun/*/status` dikecualikan dari perlindungan CSRF tanpa alasan keamanan yang valid, membuka celah manipulasi status akun.

### 3.3. Area Hak Akses & Role (Spatie)
1. **Fatal Enum Error di `UserPolicy`:**
   - File `app/Policies/UserPolicy.php` memanggil konstanta yang tidak ada: `UserRole::Admin` dan `UserRole::Manager`. Saat method `viewAny`, `view`, `create`, `update`, atau `delete` dipanggil untuk user non-super-admin, aplikasi mengalami fatal crash HTTP 500.
2. **Broken Access Control pada Rute Operasional:**
   - Resource route `users` dan method mutasi `sesi-pekerja` tidak diproteksi oleh role middleware di `routes/web.php`.

### 3.4. Area Frontend UI / Inertia
1. **Kelola Akun Fallback ke Seeder:**
   - Logika penentuan server data:
     ```tsx
     const hasServerData = users && Array.isArray(users.data) && users.data.length > 0;
     ```
     Jika admin memfilter nama yang tidak ditemukan (0 hasil), kondisi di atas bernilai `false` dan tabel langsung me-render data palsu dari `seederUsers`.
2. **18 TypeScript Compilation Errors:**
   - File `DetailBarangDrawer.tsx`, `StatusBadge.tsx`, `laporanConstants.ts`, dan step form Submit Berkas gagal saat diuji dengan `npx tsc --noEmit`.

### 3.5. Area Database & Performa
1. **N+1 Query di Monitoring Barang:**
   - Pemanggilan `ShippingSession::where('assignment_no', ...)->with([...])->first()` dan `Checkpoint::orderBy('sequence')->get()` di dalam loop `map()` dari seluruh dokumen menghasilkan puluhan query redundan per request.
2. **Sensitivitas Huruf Linux pada Inertia Test:**
   - Bawaan Inertia mencari `js/pages` (huruf kecil), sedangkan struktur proyek menggunakan `js/Pages`. Hal ini menyebabkan test suite gagal di lingkungan Linux.

### 3.6. Area Docker & Environment
1. **Vite Polling di Docker:**
   - Ketiadaan `usePolling: true` pada `vite.config.ts` menyebabkan file watcher tidak merespons perubahan kode pada mount Windows/WSL.
2. **Symlink Storage Hilang:**
   - Folder `public/storage` belum terhubung ke `storage/app/public`, menyebabkan file yang diunggah tidak dapat diakses publik.

---

## 4. Rencana Tindakan Perbaikan (Action Plan)

### Fase 1: Perbaikan Kritis & Keamanan (Prioritas Tertinggi)
1. Perbaiki `app/Policies/UserPolicy.php` dengan menghapus referensi ke `UserRole::Admin` dan `UserRole::Manager`.
2. Hapus pengecualian CSRF `'kelola-akun/*/status'` di `bootstrap/app.php`.
3. Bungkus rute `/users` dan `/sesi-pekerja/{session}/*` dengan middleware `role:super-admin` dan `role:super-admin|staff` di `routes/web.php`.
4. Jalankan `php artisan storage:link` di container aplikasi.

### Fase 2: Perbaikan Fungsional & Frontend
1. Perbaiki `FormData.append` pada 4 step submit berkas untuk mencegah coercion string `"null"`.
2. Perbaiki logika `hasServerData` di `KelolaAkun/Index.tsx` dan tambahkan debounce pada input pencarian.
3. Selaraskan tipe TypeScript di `resources/js/Pages/MonitoringBarang/types/monitoringBarang.ts` dan `laporanConstants.ts` hingga `npx tsc --noEmit` lolos 100%.
4. Tambahkan guard pengecekan key Reverb pada `useRealtimeUpdates.ts` untuk menghentikan spam error console.

### Fase 3: Optimasi Query & Arsitektur
1. Optimalkan query di `MonitoringBarangService` dan `MonitoringCheckpointController` menggunakan batch eager loading untuk mengeliminasi masalah N+1.
2. Publish konfigurasi Inertia dan sesuaikan path `js/Pages` agar seluruh unit/feature test lolos di Linux/Docker.
3. Tambahkan `watch: { usePolling: true }` pada `vite.config.ts`.
4. Refaktor controller yang melanggar arsitektur berlapis ke Form Request dan Service terdedikasi.
