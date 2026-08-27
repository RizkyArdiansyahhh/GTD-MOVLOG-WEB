# Analisis Ketidakcocokan (Mismatch) Antara `PreviewPibStep.tsx`, `SubmitBerkasController.php`, dan `DocumentSubmissionService.php`

Dokumen ini berisi analisis teknis mendalam mengenai **ketidakcocokan (mismatch)** antara komponen frontend [`PreviewPibStep.tsx`](file:///Ubuntu/home/ieull/projects/GTD-MOVLOG-WEB/resources/js/Pages/SubmitBerkas/components/steps/PreviewPibStep.tsx) dengan dua file backend utama, yaitu [`SubmitBerkasController.php`](file:///Ubuntu/home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Controllers/Web/SubmitBerkasController.php) dan [`DocumentSubmissionService.php`](file:///Ubuntu/home/ieull/projects/GTD-MOVLOG-WEB/app/Services/DocumentSubmissionService.php).

---

## 1. Ringkasan Temuan (Executive Summary)

> [!WARNING]
> **Ya, terdapat 4 ketidakcocokan fatal & signifikan.**
> 
> Perubahan terbaru pada backend telah mengadopsi arsitektur berbasis `assignment_no_ref` (penyimpanan bertahap ke database per-step), namun komponen frontend `PreviewPibStep.tsx` dan `WizardContext.tsx` masih menggunakan pola lama (mengirimkan seluruh JSON payload sekaligus tanpa parameter `assignment_no_ref`).
> 
> Akibatnya, **fitur Submit Berkas saat ini dipastikan akan selalu GAGAL (HTTP 422 / Validation Error)** jika dijalankan dari antarmuka web.

---

## 2. Rincian Ketidakcocokan (Detailed Mismatch Analysis)

### 🔴 Mismatch 1: Format URL Route & Parameter `finalize` (FATAL)

#### Perbandingan Kode:

- **Backend (`routes/web.php` & `SubmitBerkasController.php`)**:
  ```php
  // routes/web.php
  Route::post('/{assignmentNoRef}/finalize', [SubmitBerkasController::class, 'finalize'])
      ->name('submit-berkas.finalize');

  // SubmitBerkasController.php
  public function finalize(string $assignmentNoRef)
  {
      $this->documentSubmissionService->submitFinal($assignmentNoRef);
      ...
  }
  ```
  Backend mengekspektasikan `assignmentNoRef` dikirim sebagai **Route Path Parameter** di URL (misal: `/submit-berkas/ASG-20260824-X1Y2Z3/finalize`).

- **Frontend (`PreviewPibStep.tsx` Baris 348)**:
  ```tsx
  router.post('/submit-berkas/finalize', payload, {
      onError: () => { ... }
  });
  ```
  Frontend memanggil URL `/submit-berkas/finalize` **tanpa menyertakan kode `{assignmentNoRef}`** pada path URL!

#### Dampak Fatal:
Ketika frontend memanggil `/submit-berkas/finalize`, sistem routing Laravel akan menganggap string `"finalize"` sebagai variabel `{assignmentNoRef}`.
Controller kemudian memanggil:
```php
$this->documentSubmissionService->submitFinal("finalize");
```
Service akan melakukan query `Document::where('assignment_no_ref', 'finalize')` yang menghasilkan **0 dokumen**.
Akibatnya, `submitFinal` melempar `ValidationException`:
> *"Dokumen belum lengkap untuk assignment finalize. Ditemukan 0/5 dokumen."*
> 
Pengiriman berkas **PASTI GAGAL** di tingkat validasi backend.

---

### 🔴 Mismatch 2: Payload Data vs Ekspektasi Database Upsert

#### Perbandingan Kode:

- **Frontend (`PreviewPibStep.tsx` Baris 338-346)**:
  ```tsx
  const payload = JSON.parse(
      JSON.stringify({
          billOfLading: bol,
          commercialInvoice: ci,
          packingList: pl,
          certificateOfOrigin: coo,
          insurance: insurance,
      })
  );

  router.post('/submit-berkas/finalize', payload, ...);
  ```
  Frontend menyusun objek JSON raksasa berisi seluruh data 5 dokumen (`bol`, `ci`, `pl`, `coo`, `insurance`) dan mengirimkannya dalam body request POST.

- **Backend (`SubmitBerkasController.php` & `DocumentSubmissionService.php`)**:
  ```php
  // SubmitBerkasController.php
  public function finalize(string $assignmentNoRef)
  {
      // $request body sama sekali TIDAK dibaca!
      $this->documentSubmissionService->submitFinal($assignmentNoRef);
      ...
  }

  // DocumentSubmissionService.php
  public function submitFinal(string $assignmentNoRef): void
  {
      // Hanya mengubah status baris yang sudah ADA di database dari DRAFT -> PENDING
      $documents = Document::where('assignment_no_ref', $assignmentNoRef)->lockForUpdate()->get();
      ...
  }
  ```

#### Dampak:
1. **Redudansi Payload**: Pengiriman `$payload` dari frontend sia-sia karena backend tidak membacanya.
2. **Ketergantungan Step Sebelumnya**: Backend mengasumsikan bahwa **setiap step (Step 1-5) sudah pernah di-upsert** ke tabel `documents` di database melalui endpoint `POST /submit-berkas/step` (`saveStep`). Jika frontend belum menyimpan per-step ke database, data di DB kosong.

---

### 🔴 Mismatch 3: `assignment_no_ref` Belum Disimpan di Frontend State (`WizardContext.tsx`)

#### Temuan Analisis:
- Backend `DocumentSubmissionService` sangat bergantung pada `assignment_no_ref` untuk menghubungkan ke-5 dokumen.
- Backend telah menyediakan endpoint `POST /submit-berkas/start` (`startAssignment`) untuk men-generate `assignment_no_ref` baru.
- Namun, pada frontend [`WizardContext.tsx`](file:///Ubuntu/home/ieull/projects/GTD-MOVLOG-WEB/resources/js/Pages/SubmitBerkas/context/WizardContext.tsx), **tidak ada state `assignmentNoRef`** maupun logika untuk memanggil `POST /submit-berkas/start` saat customer dipilih (`selectedCustomer`).

#### Dampak:
Karena `assignmentNoRef` tidak disimpan di state/context frontend, `PreviewPibStep.tsx` tidak memiliki nilai referensi untuk disisipkan ke dalam URL request POST `/submit-berkas/${assignmentNoRef}/finalize`.

---

### 🟡 Mismatch 4: Class Request Belum Ada (`SaveDocumentStepRequest`)

#### Temuan Analisis:
- Pada [`SubmitBerkasController.php`](file:///Ubuntu/home/ieull/projects/GTD-MOVLOG-WEB/app/Http/Controllers/Web/SubmitBerkasController.php) baris 4:
  ```php
  use App\Http\Requests\SaveDocumentStepRequest;
  ```
- Namun file FormRequest `SaveDocumentStepRequest.php` **belum dibuat** di direktori `app/Http/Requests/`.

#### Dampak:
Jika endpoint `POST /submit-berkas/step` (`saveStep`) dipanggil oleh frontend, PHP akan melempar error `ReflectionException / ClassNotFoundException` karena kelas `SaveDocumentStepRequest` tidak ditemukan.

---

## 3. Matriks Perbandingan & Ketidakcocokan

| Aspek | `PreviewPibStep.tsx` (Frontend) | `SubmitBerkasController` & `Service` (Backend) | Status Mismatch |
|---|---|---|---|
| **URL Endpoint Finalize** | `/submit-berkas/finalize` | `/submit-berkas/{assignmentNoRef}/finalize` | ❌ **MISMATCH FATAL** |
| **Payload Request Finalize** | Mengirim JSON raksasa 5 dokumen | Tidak membaca body payload; mengandalkan data DB | ❌ **MISMATCH ARSITEKTUR** |
| **Penyimpanan `assignmentNoRef`** | Tidak ada di State / Context | Wajib ada di URL path & database | ❌ **MISMATCH STATE** |
| **Penyimpanan Per-Step** | Tersimpan di Memory React (`useState`) | Wajib di-POST per step via `saveStep()` ke DB | ❌ **MISMATCH ALUR DATA** |
| **Import FormRequest Backend** | - | Requires `SaveDocumentStepRequest` (File missing) | ❌ **MISSING FILE** |

---

## 4. Langkah Perbaikan Yang Direkomendasikan (Solution Plan)

Untuk melepaskan potensi error dan menyinkronkan frontend dengan backend baru, dilakukan langkah-langkah berikut:

### Langkah 1: Perbarui `WizardContext.tsx`
Tambahkan state `assignmentNoRef` di `WizardContext.tsx`. Saat pengguna memilih customer di `CustomerSelectModal`, panggil endpoint `POST /submit-berkas/start` untuk mendapatkan `assignment_no_ref`, lalu simpan di context:
```tsx
const [assignmentNoRef, setAssignmentNoRef] = useState<string | null>(null);
```

### Langkah 2: Hubungkan Form Step (Step 1–5) ke `POST /submit-berkas/step`
Di setiap step (BL, CI, PL, COO, Insurance), saat user klik "Simpan & Lanjut", kirim data via API/Inertia ke `POST /submit-berkas/step` agar record `documents` berstatus `DRAFT` terbentuk secara bertahap di DB.

### Langkah 3: Perbarui `PreviewPibStep.tsx`
Ubah pemanggilan submit di `PreviewPibStep.tsx` (baris 348):
```tsx
// SEBELUM:
// router.post('/submit-berkas/finalize', payload, ...);

// SESUAIKAN MENJADI:
router.post(`/submit-berkas/${assignmentNoRef}/finalize`, {}, {
    onError: (errors) => {
        setSubmitError(errors.assignment_no_ref || 'Gagal mengirim berkas. Silakan coba lagi.');
        setIsSubmitting(false);
        setShowConfirm(false);
    },
    onFinish: () => setIsSubmitting(false),
});
```

### Langkah 4: Buat `SaveDocumentStepRequest.php`
Buat file request di `app/Http/Requests/SaveDocumentStepRequest.php` untuk memvalidasi atribut `assignment_no_ref`, `customer_id`, `document_type_id`, `document_data`, `file_name`, dan `file_path`.

---
*Dokumen analisis ini disusun untuk memastikan sinkronisasi antara komponen frontend React dan backend Laravel.*
