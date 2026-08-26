<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DocumentStatus;
use App\Models\Document;
use App\Models\DocumentType;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DocumentSubmissionService
{
    /**
     * Jumlah dokumen wajib dalam satu paket assignment.
     * BL (1), CI (2), PL (3), COO (4), Insurance (5) = 5.
     */
    private const REQUIRED_DOCUMENT_COUNT = 5;

    /**
     * Generate nomor referensi penugasan (assignment_no_ref) baru.
     * Dipanggil saat customer pertama kali dipilih/didaftarkan di awal wizard.
     */
    public function generateAssignmentRef(): string
    {
        // Contoh format: ASG-20260827-A1B2C3
        return 'ASG-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    }

    /**
     * Simpan / update satu dokumen per-step (upsert).
     * Dipanggil setiap kali user klik "Simpan & Lanjut" pada masing-masing step.
     *
     * @param array $data Berisi: assignment_no_ref, customer_id, document_type_id,
     *                    document_data, file_name, file_path
     * @param string|null $uploadedBy ID user yang mengunggah
     */
    public function saveStep(array $data, ?string $uploadedBy = null): Document
    {
        // Pastikan customer_id konsisten dengan dokumen lain pada assignment yang sama
        $this->assertCustomerLocked($data['assignment_no_ref'], $data['customer_id']);

        // Siapkan fallback file_name & file_path jika file fisik/URL tidak dikirim (misal saat testing mock data)
        $fileName = !empty($data['file_name']) 
            ? $data['file_name'] 
            : 'document_' . $data['document_type_id'] . '.pdf';

        $filePath = !empty($data['file_path']) 
            ? $data['file_path'] 
            : ('documents/' . $data['assignment_no_ref'] . '/' . $fileName);

        return DB::transaction(function () use ($data, $fileName, $filePath, $uploadedBy) {
            return Document::updateOrCreate(
                [
                    'assignment_no_ref' => $data['assignment_no_ref'],
                    'document_type_id'  => $data['document_type_id'],
                ],
                [
                    'customer_id'    => $data['customer_id'],
                    'document_data'  => $data['document_data'],
                    'file_name'      => $fileName,
                    'file_path'      => $filePath,
                    'status'         => DocumentStatus::DRAFT,
                    'uploaded_by'    => $uploadedBy ?? auth()->id(),
                    'uploaded_at'    => now(),
                ]
            );
        });
    }

    /**
     * Ambil seluruh dokumen dalam satu assignment_no_ref.
     * Digunakan untuk resume wizard dan tampilan Preview PIB.
     */
    public function getByAssignmentRef(string $assignmentNoRef): Collection
    {
        return Document::where('assignment_no_ref', $assignmentNoRef)
            ->with('documentType')
            ->orderBy('document_type_id', 'asc')
            ->get();
    }

    /**
     * Finalisasi submission di step Preview PIB.
     * Mengubah status DRAFT -> PENDING secara atomik untuk seluruh dokumen dalam assignment.
     *
     * @throws ValidationException jika dokumen belum lengkap (5/5)
     */
    public function submitFinal(string $assignmentNoRef): void
    {
        DB::transaction(function () use ($assignmentNoRef) {
            $documents = Document::where('assignment_no_ref', $assignmentNoRef)
                ->lockForUpdate()
                ->get();

            $this->assertComplete($documents, $assignmentNoRef);
            $this->assertAllDraft($documents);

            Document::where('assignment_no_ref', $assignmentNoRef)
                ->update([
                    'status'     => DocumentStatus::PENDING->value,
                    'updated_at' => now(),
                ]);
        });
    }

    /**
     * Pastikan seluruh jenis dokumen (5/5) sudah diisi sebelum boleh finalisasi.
     */
    private function assertComplete(Collection $documents, string $assignmentNoRef): void
    {
        // Ambil seluruh ID tipe dokumen master (1 s/d 5)
        $requiredTypeIds = DocumentType::query()
            ->whereIn('id', [1, 2, 3, 4, 5])
            ->pluck('id');

        $existingTypeIds = $documents->pluck('document_type_id')->unique();
        $missing = $requiredTypeIds->diff($existingTypeIds);

        if ($documents->count() < self::REQUIRED_DOCUMENT_COUNT || $missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'assignment_no_ref' => "Dokumen belum lengkap untuk assignment {$assignmentNoRef}. "
                    . "Ditemukan {$documents->count()}/" . self::REQUIRED_DOCUMENT_COUNT . " dokumen.",
            ]);
        }
    }

    /**
     * Pastikan tidak ada dokumen yang sudah berstatus selain DRAFT (mencegah double finalize).
     */
    private function assertAllDraft(Collection $documents): void
    {
        $nonDraft = $documents->where('status', '!=', DocumentStatus::DRAFT);

        if ($nonDraft->isNotEmpty()) {
            throw ValidationException::withMessages([
                'assignment_no_ref' => 'Sebagian dokumen sudah pernah disubmit sebelumnya.',
            ]);
        }
    }

    /**
     * Pastikan customer_id konsisten untuk seluruh dokumen dalam satu assignment_no_ref.
     */
    private function assertCustomerLocked(string $assignmentNoRef, string $customerId): void
    {
        $existingCustomerId = Document::where('assignment_no_ref', $assignmentNoRef)
            ->value('customer_id');

        if ($existingCustomerId && $existingCustomerId !== $customerId) {
            throw ValidationException::withMessages([
                'customer_id' => 'Customer tidak sesuai dengan assignment yang sedang berjalan.',
            ]);
        }
    }
}
