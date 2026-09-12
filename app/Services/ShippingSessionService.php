<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DocumentStatus;
use App\Enums\ShippingSessionStatus;
use App\Models\Checkpoint;
use App\Models\Document;
use App\Models\ShippingSession;
use Illuminate\Support\Facades\DB;

/**
 * Shipping Session Service
 *
 * Owns the domain rule: when all 5 unique document types for one
 * assignment_no_ref are VERIFIED, generate exactly one shipping_sessions row.
 * Idempotent — safe to call repeatedly, never duplicates.
 */
class ShippingSessionService
{
    public function __construct(
        private readonly SessionCheckpointService $sessionCheckpointService,
    ) {}

    public function maybeGenerateForAssignment(string $assignmentNoRef): ?ShippingSession
    {
        if (ShippingSession::query()->where('assignment_no', $assignmentNoRef)->exists()) {
            return null;
        }

        $documents = Document::query()
            ->where('assignment_no_ref', $assignmentNoRef)
            ->with('documentType')
            ->get();

        // Completeness = the 5 mandatory document type NAMES, not mere
        // count === 5. Never compare by hardcoded PK ids: PostgreSQL
        // sequences advance even for rolled-back inserts, so ids are only
        // [1..5] on a perfectly fresh database (breaks under full suites).
        $requiredTypeNames = [
            'Bill of Lading',
            'Commercial Invoice',
            'Packing List',
            'Certificate of Origin (COO)',
            'Insurance',
        ];
        sort($requiredTypeNames);

        $existingTypeNames = $documents
            ->map(fn (Document $doc) => $doc->documentType?->name)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $isComplete = $existingTypeNames === $requiredTypeNames;
        $allVerified = $documents->isNotEmpty() && $documents->every(function (Document $doc) {
            $status = $doc->status instanceof DocumentStatus ? $doc->status->value : (string) $doc->status;

            return strtoupper($status) === DocumentStatus::VERIFIED->value;
        });

        if (! $isComplete || ! $allVerified) {
            return null;
        }

        $customerId = $documents->first()->customer_id;

        $ciDocument = $documents->first(
            fn (Document $doc) => $doc->documentType?->name === 'Commercial Invoice'
        );

        if (! $ciDocument) {
            report(new \RuntimeException(
                "Commercial Invoice not found for assignment {$assignmentNoRef}, shipping_sessions not generated."
            ));

            return null;
        }

        $ciData = $ciDocument->document_data ?? [];

        $cargoNames = collect($ciData['cargoDetail'] ?? [])
            ->pluck('descriptionOfGoods')
            ->filter()
            ->implode(', ');

        $firstCheckpoint = Checkpoint::query()->orderBy('sequence', 'asc')->first();

        $session = null;
        DB::transaction(function () use ($assignmentNoRef, $customerId, $cargoNames, $ciData, $firstCheckpoint, &$session) {
            $session = ShippingSession::create([
                'customer_id' => $customerId,
                'created_by' => auth()->id(),
                'assignment_no' => $assignmentNoRef,
                'cargo_name' => $cargoNames !== '' ? $cargoNames : '-',
                'total_quantity' => (float) ($ciData['totalQuantity']['totalGoods'] ?? 0),
                'unit' => $ciData['totalQuantity']['totalGoodsUnit'] ?? '-',
                'origin' => $ciData['transportDetail']['portOfLoading'] ?? null,
                'destination' => $ciData['transportDetail']['portOfDischarge'] ?? null,
                'current_checkpoint_id' => $firstCheckpoint?->id,
                'status' => ShippingSessionStatus::PENDING->value,
            ]);

            Document::query()
                ->where('assignment_no_ref', $assignmentNoRef)
                ->update(['shipping_session_id' => $session->id]);

            $this->sessionCheckpointService->createCheckpointsForSession($session);
        });

        return $session;
    }
}
