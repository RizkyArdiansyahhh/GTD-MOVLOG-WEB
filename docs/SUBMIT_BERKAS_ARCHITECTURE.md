# Dokumentasi Arsitektur & Analisis Keterkaitan Modul Submit Berkas

Dokumen ini menjelaskan rancang bangun, alur data (*data flow*), dan keterkaitan teknis antara 8 file utama pada modul **Submit Berkas (PIB Submission Wizard)** di aplikasi **GTD-MOVLOG-WEB**.

---

## 1. Arsitektur & Gambaran Umum Sistem

Modul **Submit Berkas** dirancang sebagai sistem *multi-step wizard* untuk proses pengunggahan dan pengisian data dokumen ekspor/impor (logistik kepabeanan/PIB), yang mencakup:
1. **Bill of Lading (B/L)**
2. **Commercial Invoice (CI)**
3. **Packing List (PL)**
4. **Certificate of Origin (COO)**
5. **Insurance**
6. **Preview PIB (Final Submission)**

Sistem ini dibangun dengan stack **Laravel 12 (Backend Service & Controller Layer)**, **Inertia.js (Bridge)**, dan **React + TypeScript (Frontend Component Layer)**.

---

## 2. Diagram Keterkaitan Antar Komponen (Mermaid Flow)

```mermaid
flowchart TD
    subgraph Database Layer
        DB_Seed[CustomerSeeder.php] -->|Seed Data Awal| DB_Table[(customers & documents)]
        DB_Table <--> Model_Cust[Customer.php Model]
    end

    subgraph Routing & Request Layer
        Route[routes/web.php] -->|Route Definitions| Controller[SubmitBerkasController.php]
        FormReq[SaveDocumentStepRequest.php] -->|Validasi Input Step| Controller
    end

    subgraph Service & Business Logic Layer
        Controller <--> Service[DocumentSubmissionService.php]
        Service <--> DB_Table
    end

    subgraph Frontend / UI Layer (Inertia + React)
        Controller -->|Render Inertia Props 'customers'| Page_Submit[SubmitBerkas.tsx]
        Page_Submit -->|Tampilkan jika selectedCustomer null| Modal_Cust[CustomerSelectModal.tsx]
        Modal_Cust -->|POST /submit-berkas/customers| Controller
        Modal_Cust -->|Pilih Customer & Mulai Wizard| Page_Submit
        Page_Submit -->|POST /submit-berkas/step| Controller
        Page_Submit -->|POST /submit-berkas/{ref}/finalize| Controller
    end
```

---

## 3. Matriks Alur Keterkaitan Antar File

| Tahap Proses | File yang Terlibat | Hubungan & Peran |
| :--- | :--- | :--- |
| **1. Penyediaan Data Master** | [CustomerSeeder.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/database/seeders/CustomerSeeder.php)<br>[Customer.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Models/Customer.php) | Menyiapkan data awal pelanggan ke database menggunakan model Eloquent `Customer` dengan format ULID. |
| **2. Routing Endpoint** | [routes/web.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/routes/web.php) | Mendefinisikan seluruh jalur HTTP berautentikasi (`/submit-berkas/*` dan `/customers`) menuju `SubmitBerkasController`. |
| **3. Inisialisasi Halaman Frontend** | [SubmitBerkasController.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Controllers/Web/SubmitBerkasController.php)<br>[Customer.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Models/Customer.php)<br>[SubmitBerkas.tsx](file:///home/ieull/projects/GTD-MOVLOG-WEB/resources/js/Pages/SubmitBerkas/SubmitBerkas.tsx) | Controller memanggil `Customer::latest()->get()`, diubah menjadi format camelCase melalui override `toArray()` pada Model, lalu diteruskan via Inertia ke `SubmitBerkas.tsx`. |
| **4. Pemilihan / Pembuatan Customer** | [SubmitBerkas.tsx](file:///home/ieull/projects/GTD-MOVLOG-WEB/resources/js/Pages/SubmitBerkas/SubmitBerkas.tsx)<br>[CustomerSelectModal.tsx](file:///home/ieull/projects/GTD-MOVLOG-WEB/resources/js/Pages/SubmitBerkas/components/CustomerSelectModal.tsx)<br>[SubmitBerkasController.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Controllers/Web/SubmitBerkasController.php) | Jika belum ada customer terpilih, modal muncul. User bisa memilih dari daftar atau membuat customer baru via AJAX `POST /submit-berkas/customers`. |
| **5. Validasi & Penyimpanan Step Dokumen** | [SaveDocumentStepRequest.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Requests/SaveDocumentStepRequest.php)<br>[SubmitBerkasController.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Controllers/Web/SubmitBerkasController.php)<br>[DocumentSubmissionService.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Services/DocumentSubmissionService.php) | Setiap step dokumen di-submit ke `POST /submit-berkas/step`. Request divalidasi oleh `SaveDocumentStepRequest`, lalu dieksekusi secara atomik oleh `DocumentSubmissionService::saveStep()`. |
| **6. Penguncian & Finalisasi (PIB)** | [DocumentSubmissionService.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Services/DocumentSubmissionService.php)<br>[SubmitBerkasController.php](file:///home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Controllers/Web/SubmitBerkasController.php) | Service memastikan customer terkunci (`assertCustomerLocked`), memverifikasi kelengkapan 5 dokumen wajib (`assertComplete`), dan mengubah status draft menjadi `PENDING` menggunakan database transaction + `lockForUpdate()`. |

---

## 4. Penjelasan Detail Setiap File

### 1. `database/seeders/CustomerSeeder.php`
- **Tanggung Jawab:** Menyediakan data *dummy/master* entitas Customer ke dalam tabel database untuk keperluan pengujian dan *environment setup*.
- **Komponen Kunci:**
  - `updateOrCreate(['company_name' => $item['company_name']], $item)`: Mencegah duplikasi data ketika seeder dijalankan berulang kali.
  - Data yang diisi: `company_name`, `address`, `phone`, `email`, dan `pic_name`.
- **Keterkaitan:** Memasok data yang nantinya akan dibaca oleh `Customer.php` saat `SubmitBerkasController::index()` dieksekusi.

---

### 2. `app/Models/Customer.php`
- **Tanggung Jawab:** Model Eloquent yang merepresentasikan tabel `customers`.
- **Fitur Khusus:**
  - `use HasUlids;`: Menggunakan format ULID sebagai primary key (non-autoincrement, string terurut).
  - `$fillable`: Menjaga atribut `company_name`, `address`, `phone`, `email`, dan `pic_name` dari *mass-assignment vulnerability*.
  - **Override `toArray()`:**
    ```php
    public function toArray(): array
    {
        $array = parent::toArray();
        $array['companyName'] = $this->attributes['company_name'] ?? null;
        $array['picName']     = $this->attributes['pic_name'] ?? null;
        return $array;
    }
    ```
    *Alasan desain:* Menyediakan properti `companyName` dan `picName` dalam format `camelCase` untuk kompatibilitas langsung dengan antarmuka TypeScript di Frontend tanpa menimbulkan konflik *accessor* dengan `HasUlids` di Laravel 12.
  - Relasi `shippingSessions()`: Menghubungkan Customer dengan sesi pengiriman logistik (`HasMany`).

---

### 3. `routes/web.php`
- **Tanggung Jawab:** Pendaftaran rute HTTP aplikasi web dengan middleware keamanan `auth` dan `verified`.
- **Grup Rute Submit Berkas (`Route::prefix('submit-berkas')`):**
  - `GET /submit-berkas`: Mengarah ke `SubmitBerkasController@index` (halaman utama wizard).
  - `POST /submit-berkas/customers`: Mengarah ke `SubmitBerkasController@storeCustomer` (pendaftaran customer via modal).
  - `POST /submit-berkas/start`: Mengarah ke `SubmitBerkasController@startAssignment` (pembuatan nomor referensi assignment `ASG-YYYYMMDD-XXXXXX`).
  - `POST /submit-berkas/step`: Mengarah ke `SubmitBerkasController@saveStep` (penyimpanan draft per-step).
  - `GET /submit-berkas/{assignmentNoRef}`: Mengarah ke `SubmitBerkasController@show` (mengambil seluruh data dokumen assignment).
  - `POST /submit-berkas/{assignmentNoRef}/finalize`: Mengarah ke `SubmitBerkasController@finalize` (finalisasi pengajuan berkas).
  - `GET /submit-berkas/{assignmentNoRef}/status`: Mengarah ke `SubmitBerkasController@status` (halaman review status akhir).

---

### 4. `app/Http/Controllers/Web/SubmitBerkasController.php`
- **Tanggung Jawab:** *Orchestrator* antara HTTP Request, Service Layer, Model, dan Inertia View.
- **Daftar Method:**
  - `index()`: Merender halaman `SubmitBerkas/SubmitBerkas` via Inertia dan mengirimkan prop `customers` (`Customer::latest()->get()`).
  - `storeCustomer(Request $request)`: Menerima data pembuatan customer baru dari modal, melakukan validasi, membuat record `Customer`, dan mengembalikan response JSON 201.
  - `startAssignment(Request $request)`: Memanggil service untuk generate nomor referensi assignment baru.
  - `saveStep(SaveDocumentStepRequest $request)`: Menerima request step yang sudah tervalidasi, lalu mendelegasikannya ke `DocumentSubmissionService::saveStep()`.
  - `show(string $assignmentNoRef)`: Mengambil seluruh dokumen dalam satu assignment untuk kebutuhan *resume wizard* atau pratinjau.
  - `finalize(string $assignmentNoRef)`: Memanggil `DocumentSubmissionService::submitFinal()` lalu me-redirect user ke halaman status dengan pesan sukses.
  - `status(string $assignmentNoRef)`: Merender halaman ringkasan status pengajuan berkas (`SubmitBerkas/Status`).

---

### 5. `app/Http/Requests/SaveDocumentStepRequest.php`
- **Tanggung Jawab:** Memvalidasi payload data yang dikirimkan frontend setiap kali user menyimpan salah satu step dokumen.
- **Aturan Validasi (`rules`):**
  - `assignment_no_ref`: Wajib (`required|string`).
  - `customer_id`: Wajib, bertipe string, dan harus ada di tabel `customers` kolom `id` (`exists:customers,id`).
  - `document_type_id`: Wajib (`required|string`).
  - `document_data`: Wajib bertipe JSON/Array (`required|array`) yang berisi form dinamis sesuai jenis dokumen.
  - `file_name` & `file_path`: Opsional/nullable string untuk menyimpan referensi file fisik yang diunggah.

---

### 6. `app/Services/DocumentSubmissionService.php`
- **Tanggung Jawab:** *Business Logic Layer* untuk pengolahan berkas, integritas data, dan aturan validasi kepabeanan/assignment.
- **Konstanta & Aturan Bisnis:**
  - `STATUS_DRAFT = 'DRAFT'`, `STATUS_PENDING = 'PENDING'`.
  - `REQUIRED_DOCUMENT_COUNT = 5`: Jumlah dokumen wajib sebelum finalisasi.
- **Fitur & Mekanisme Pengamanan:**
  - `generateAssignmentRef()`: Membuat kode referensi unik (format: `ASG-YYYYMMDD-XXXXXX`).
  - `saveStep(array $data, string $uploadedBy)`:
    - Menjalankan `assertCustomerLocked()` untuk memastikan customer tidak berubah di tengah-tengah assignment yang sedang berjalan.
    - Melakukan `Document::updateOrCreate()` (upsert) di dalam `DB::transaction`.
  - `submitFinal(string $assignmentNoRef)`:
    - Menggunakan `DB::transaction` dan `lockForUpdate()` untuk mencegah *race condition* (misal user mengklik submit berkali-kali secara simultan).
    - Memanggil `assertComplete()`: Memvalidasi bahwa ke-5 jenis dokumen wajib (`BL`, `CI`, `PL`, `COO`, `Insurance`) sudah terunggah lengkap.
    - Memanggil `assertAllDraft()`: Memastikan dokumen belum pernah disubmit/diverifikasi sebelumnya (mencegah *double-finalize*).
    - Mengupdate status seluruh dokumen menjadi `PENDING`.

---

### 7. `resources/js/Pages/SubmitBerkas/SubmitBerkas.tsx`
- **Tanggung Jawab:** Komponen halaman utama (Inertia View) untuk alur *Wizard Submit Berkas*.
- **Struktur Komponen:**
  - `SubmitBerkas({ customers = [] })`: Menerima props `customers` dari `SubmitBerkasController::index()`, membungkus halaman dengan `DashboardLayout` dan `WizardProvider`.
  - `WizardContent({ customers })`: Mengatur logika tampilan berbasis step:
    - Jika `selectedCustomer` belum dipilih di context, halaman merender `CustomerSelectModal`.
    - Jika sudah terpilih, merender `WizardHeader`, `Stepper`, dan step dokumen aktif (0: `BillOfLadingStep`, 1: `CommercialInvoiceStep`, 2: `PackingListStep`, 3: `CertificateOfOriginStep`, 4: `InsuranceStep`, 5: `PreviewPibStep`).

---

### 8. `resources/js/Pages/SubmitBerkas/components/CustomerSelectModal.tsx`
- **Tanggung Jawab:** Modal interaktif untuk pencarian, pemilihan, dan pembuatan customer baru sebelum wizard dimulai.
- **Fitur & Interaktivitas:**
  - **Mode Search (`mode === 'search'`):**
    - Input pencarian real-time untuk memfilter customer berdasarkan nama perusahaan (`companyName`/`company_name`) atau nama PIC (`picName`/`pic_name`).
    - Menampilkan daftar customer yang cocok, dan saat dipilih memanggil callback `onConfirm(customer)`.
  - **Mode Create (`mode === 'create'`):**
    - Form penambahan customer baru (`companyName`, `address`, `phone`, `email`, `picName`).
    - Mengirimkan AJAX request `POST /submit-berkas/customers` (dengan CSRF token).
    - Setelah berhasil dibuat, customer langsung dipilih otomatis (`onConfirm(newCustomer)`), sehingga user dapat langsung melanjutkan ke wizard tanpa perlu mencari ulang.

---

## 5. Ringkasan Pola Desain (Design Patterns)

1. **Service Layer Pattern (`DocumentSubmissionService`):** Memisahkan *business rules* dan manipulasi database yang kompleks dari Controller, menjaga Controller tetap ramping (*thin controller*).
2. **Form Request Pattern (`SaveDocumentStepRequest`):** Mengisolasi logika validasi input HTTP sebelum masuk ke Controller.
3. **Database Concurrency Control (`lockForUpdate` & Transactions):** Menjamin konsistensi data saat proses multi-step submission dan mencegah *double submit*.
4. **State Management via React Context (`WizardContext`):** Menyimpan status customer terpilih, nomor assignment, dan progres step secara global di sisi klien.
5. **Polymorphic / Dynamic JSON Storage (`document_data`):** Memungkinkan setiap jenis dokumen (B/L, Invoice, Packing List, dll.) menyimpan struktur field yang berbeda-beda tanpa harus mengubah skema tabel database.
