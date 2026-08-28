<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DocumentStatus;
use App\Models\Document;
use App\Models\DocumentType;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DocumentSubmissionService
{
    private const REQUIRED_DOCUMENT_COUNT = 5;

    /**
     * Generate nomor referensi penugasan (assignment_no_ref) baru.
     */
    public function generateAssignmentRef(): string
    {
        return 'ASG-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    }

    /**
     * Simpan / update satu dokumen per-step (upsert).
     */
    public function saveStep(array $data, ?string $uploadedBy = null): Document
    {
        $this->assertCustomerLocked($data['assignment_no_ref'], $data['customer_id']);

        $fileName = !empty($data['file_name'])
            ? $data['file_name']
            : 'document_' . $data['document_type_id'] . '.pdf';

        // Normalisasi path agar tidak ada leading slash '/'
        $filePath = !empty($data['file_path'])
            ? ltrim($data['file_path'], '/')
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
                    'remarks'        => null,
                    'uploaded_by'    => $uploadedBy ?? auth()->id(),
                    'uploaded_at'    => now(),
                ]
            );
        });
    }

    /**
     * Ambil seluruh dokumen dalam satu assignment_no_ref.
     */
    public function getByAssignmentRef(string $assignmentNoRef): Collection
    {
        return Document::where('assignment_no_ref', $assignmentNoRef)
            ->with('documentType')
            ->orderBy('document_type_id', 'asc')
            ->get();
    }

    /**
     * Mengambil daftar riwayat submission per assignment_no_ref untuk tabel 70%.
     * Query diperbaiki: 1 baris per assignment dengan status dominan.
     */
    public function getAssignmentSummaries(): Collection
    {
        return Document::query()
            ->select(
                'assignment_no_ref',
                'customer_id',
                DB::raw('MAX(created_at) as created_at'),
                DB::raw('COUNT(id) as total_documents'),
                DB::raw("
                    CASE
                        WHEN SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) > 0 THEN 'REJECTED'
                        WHEN SUM(CASE WHEN status = 'PENDING'  THEN 1 ELSE 0 END) > 0 THEN 'PENDING'
                        WHEN SUM(CASE WHEN status = 'DRAFT'    THEN 1 ELSE 0 END) > 0 THEN 'DRAFT'
                        ELSE 'VERIFIED'
                    END as dominant_status
                ")
            )
            ->with('customer:id,company_name,pic_name')
            ->groupBy('assignment_no_ref', 'customer_id')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($doc) {
                return [
                    'assignment_no_ref' => $doc->assignment_no_ref,
                    'customer_id'       => $doc->customer_id,
                    'customer_name'     => $doc->customer?->company_name ?? 'Customer Tidak Diketahui',
                    'customer_pic'      => $doc->customer?->pic_name ?? '-',
                    'total_documents'   => (int) $doc->total_documents,
                    'status'            => $doc->dominant_status ?? 'DRAFT',
                    'created_at'        => $doc->created_at
                        ? Carbon::parse($doc->created_at)->toISOString()
                        : now()->toISOString(),
                ];
            });
    }

    /**
     * Finalisasi submission di step Preview PIB.
     */
    public function submitFinal(string $assignmentNoRef): void
    {
        DB::transaction(function () use ($assignmentNoRef) {
            $documents = Document::where('assignment_no_ref', $assignmentNoRef)
                ->lockForUpdate()
                ->get();

            $this->assertComplete($documents, $assignmentNoRef);

            // Update only documents that are not already verified (e.g. DRAFT or REJECTED) to PENDING
            Document::where('assignment_no_ref', $assignmentNoRef)
                ->where('status', '!=', DocumentStatus::VERIFIED->value)
                ->update([
                    'status'     => DocumentStatus::PENDING->value,
                    'updated_at' => now(),
                ]);
        });
    }

    /**
     * Pastikan seluruh jenis dokumen (5/5) sudah diisi sebelum finalisasi.
     */
    private function assertComplete(Collection $documents, string $assignmentNoRef): void
    {
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
     * Pastikan semua dokumen berstatus draft sebelum finalisasi.
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
     * Pastikan customer_id konsisten dalam satu assignment_no_ref.
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
