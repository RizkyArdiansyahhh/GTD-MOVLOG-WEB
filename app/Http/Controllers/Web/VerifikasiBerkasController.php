<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\DocumentStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Document;
use App\Models\ShippingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Verifikasi Berkas Controller (Web / Inertia)
 *
 * Used by Supervisors to verify shipment documents submitted via Submit Berkas.
 *
 * Side effect penting: ketika SELURUH 5 dokumen wajib untuk 1 assignment_no_ref
 * sudah berstatus VERIFIED, controller ini otomatis membuat 1 row shipping_sessions
 * (lihat maybeGenerateShippingSession()), yang menjadi sumber data bagi modul
 * MonitoringCheckpoint dan modul lain yang bergantung pada shipping_sessions.
 */
class VerifikasiBerkasController extends Controller
{
    /**
     * The 5 mandatory document types required for every shipment verification.
     */
    public const REQUIRED_DOCUMENT_TYPES = [
        'Bill of Lading',
        'Commercial Invoice',
        'Packing List',
        'Certificate of Origin (COO)',
        'Insurance',
    ];

    /**
     * Helper to verify if the user has supervisor authorization.
     */
    private function checkSupervisorAuthorization(Request $request): void
    {
        $user = $request->user();
        $hasSupervisorRole = $user && (
            $user->hasRole(UserRole::Supervisor->value) ||
            $user->hasRole('supervisor') ||
            $user->hasRole('Supervisor') ||
            $user->hasRole('super-admin')
        );

        if (!$hasSupervisorRole) {
            abort(403, 'Unauthorized access to Document Verification.');
        }
    }

    /**
     * GET /verifikasi-berkas
     * Display the document verification queue for Supervisors.
     * Only retrieves submissions containing PENDING documents.
     */
    public function index(Request $request): Response
    {
        $this->checkSupervisorAuthorization($request);

        // Retrieve assignment references that contain submitted documents (non-draft)
        $submittedAssignments = Document::query()
            ->where('status', '!=', DocumentStatus::DRAFT->value)
            ->pluck('assignment_no_ref')
            ->unique()
            ->values();

        // Fetch all documents associated with these assignments to allow full shipment-level context
        $documents = Document::query()
            ->whereIn('assignment_no_ref', $submittedAssignments)
            ->with(['customer', 'documentType', 'uploadedBy', 'verifiedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        $formattedDocuments = $documents->map(fn (Document $doc) => $this->transformDocument($doc));

        return Inertia::render('VerifikasiBerkas/Index', [
            'documents' => $formattedDocuments,
        ]);
    }

    /**
     * GET /verifikasi-berkas/{assignmentNoRef}
     * Display shipment detail verification page for a specific assignment/contract.
     */
    public function show(Request $request, string $assignmentNoRef): Response
    {
        $this->checkSupervisorAuthorization($request);

        // Find documents by assignment_no_ref
        $documents = Document::query()
            ->where('assignment_no_ref', $assignmentNoRef)
            ->with(['customer', 'documentType', 'uploadedBy', 'verifiedBy'])
            ->orderBy('document_type_id', 'asc')
            ->get();

        // Fallback: search within document_data contractNumber if assignment_no_ref didn't match directly
        if ($documents->isEmpty()) {
            $documents = Document::query()
                ->where('document_data->documentDetail->shipmentContractNumber', $assignmentNoRef)
                ->orWhere('document_data->documentReference->shipmentContractNumber', $assignmentNoRef)
                ->with(['customer', 'documentType', 'uploadedBy', 'verifiedBy'])
                ->orderBy('document_type_id', 'asc')
                ->get();
        }

        $formattedDocuments = $documents->map(fn (Document $doc) => $this->transformDocument($doc));

        return Inertia::render('VerifikasiBerkas/Show', [
            'contractNumber' => $assignmentNoRef,
            'documents'      => $formattedDocuments,
        ]);
    }

    /**
     * POST /verifikasi-berkas/{document}/verify
     * Approve a document: PENDING -> VERIFIED
     */
    public function verify(Request $request, Document $document): RedirectResponse|JsonResponse
    {
        $this->checkSupervisorAuthorization($request);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $document->update([
            'status'      => DocumentStatus::VERIFIED->value,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
            'remarks'     => $validated['notes'] ?? null,
        ]);

        // Jika ini melengkapi kelima dokumen wajib untuk assignment ini,
        // otomatis buat shipping_sessions (sumber data MonitoringCheckpoint dkk).
        $this->maybeGenerateShippingSession($document->assignment_no_ref);

        if ($request->wantsJson()) {
            return response()->json([
                'message'  => "Document {$document->file_name} successfully verified.",
                'document' => $this->transformDocument($document->fresh(['customer', 'documentType', 'uploadedBy', 'verifiedBy'])),
            ]);
        }

        return back()->with('success', "Document {$document->file_name} successfully verified.");
    }

    /**
     * POST /verifikasi-berkas/{document}/reject
     * Reject a document: PENDING -> REJECTED
     */
    public function reject(Request $request, Document $document): RedirectResponse|JsonResponse
    {
        $this->checkSupervisorAuthorization($request);

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $document->update([
            'status'      => DocumentStatus::REJECTED->value,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
            'remarks'     => $validated['notes'],
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message'  => "Document {$document->file_name} rejected.",
                'document' => $this->transformDocument($document->fresh(['customer', 'documentType', 'uploadedBy', 'verifiedBy'])),
            ]);
        }

        return back()->with('error', "Document {$document->file_name} rejected.");
    }

    /**
     * GET /verifikasi-berkas/file/{document}
     * Securely serve the uploaded PDF file for direct browser/iframe preview.
     */
    public function serveFile(Request $request, Document $document): BinaryFileResponse|Response
    {
        $this->checkSupervisorAuthorization($request);

        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'The uploaded document file could not be found.');
        }

        $fullPath = Storage::disk('public')->path($document->file_path);

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($document->file_name ?? 'document.pdf') . '"',
            'Cache-Control'       => 'private, max-age=3600',
        ]);
    }

    /**
     * Cek apakah SELURUH dokumen wajib (5 jenis) untuk 1 assignment_no_ref
     * sudah berstatus VERIFIED. Jika ya dan shipping_sessions untuk assignment
     * ini belum ada, buat 1 row baru berdasarkan data Commercial Invoice.
     *
     * Filter selalu ketat berdasarkan assignment_no_ref yang sedang diproses,
     * TIDAK pernah mengambil data dari assignment lain meski customer sama
     * (1 customer bisa punya banyak shipping_sessions dari waktu ke waktu;
     * yang unik adalah assignment_no, bukan customer_id).
     *
     * Idempotent: aman dipanggil berkali-kali, tidak akan membuat duplikat
     * shipping_sessions untuk assignment_no_ref yang sama.
     */
    private function maybeGenerateShippingSession(string $assignmentNoRef): void
    {
        $alreadyExists = ShippingSession::query()
            ->where('assignment_no', $assignmentNoRef)
            ->exists();

        if ($alreadyExists) {
            return;
        }

        // Ambil SEMUA dokumen milik assignment ini (filter ketat, tidak boleh bocor ke assignment lain).
        $documents = Document::query()
            ->where('assignment_no_ref', $assignmentNoRef)
            ->with('documentType')
            ->get();

        $isComplete = $documents->count() === count(self::REQUIRED_DOCUMENT_TYPES);
        $allVerified = $documents->every(function (Document $doc) {
            $status = $doc->status instanceof DocumentStatus ? $doc->status->value : (string) $doc->status;
            return strtoupper($status) === DocumentStatus::VERIFIED->value;
        });

        if (!$isComplete || !$allVerified) {
            return;
        }

        // customer_id diambil dari dokumen DALAM assignment ini saja (aman).
        $customerId = $documents->first()->customer_id;

        $ciDocument = $documents->first(
            fn (Document $doc) => $doc->documentType?->name === 'Commercial Invoice'
        );

        if (!$ciDocument) {
            report(new \RuntimeException(
                "Commercial Invoice not found for assignment {$assignmentNoRef}, shipping_sessions not generated."
            ));
            return;
        }

        $ciData = $ciDocument->document_data ?? [];

        $cargoNames = collect($ciData['cargoDetail'] ?? [])
            ->pluck('descriptionOfGoods')
            ->filter()
            ->implode(', ');

        $firstCheckpoint = Checkpoint::query()->orderBy('id')->first();

        $shippingSession = ShippingSession::create([
            'customer_id'           => $customerId,
            'created_by'            => auth()->id(),
            'assignment_no'         => $assignmentNoRef,
            'cargo_name'            => $cargoNames !== '' ? $cargoNames : '-',
            'total_quantity'        => (float) ($ciData['totalQuantity']['totalGoods'] ?? 0),
            'unit'                  => $ciData['totalQuantity']['totalGoodsUnit'] ?? '-',
            'origin'                => $ciData['transportDetail']['portOfLoading'] ?? null,
            'destination'           => $ciData['transportDetail']['portOfDischarge'] ?? null,
            'current_checkpoint_id' => $firstCheckpoint?->id,
            'status'                => ShippingSessionStatus::PENDING->value,
        ]);

        // Isi shipping_session_id di seluruh dokumen assignment ini (sebelumnya kosong).
        Document::query()
            ->where('assignment_no_ref', $assignmentNoRef)
            ->update(['shipping_session_id' => $shippingSession->id]);
    }

    /**
     * Transform a Document Eloquent model into a clean frontend representation.
     */
    private function transformDocument(Document $doc): array
    {
        $data = $doc->document_data ?? [];
        $rawStatus = $doc->status instanceof DocumentStatus ? $doc->status->value : (string) $doc->status;

        $uiStatus = match (strtoupper($rawStatus)) {
            'VERIFIED', 'APPROVED' => 'Approved',
            'REJECTED'             => 'Rejected',
            'DRAFT'                => 'Draft',
            default                => 'Pending',
        };

        $docType = $doc->documentType?->name ?? 'Document';
        // Normalize COO naming if needed
        if ($docType === 'Certificate of Origin') {
            $docType = 'Certificate of Origin (COO)';
        }

        $documentNumber = $data['documentDetail']['number']
            ?? $data['documentReference']['commercialInvoiceNumber']
            ?? $data['documentReference']['billOfLadingNumber']
            ?? $data['document_number']
            ?? $doc->file_name
            ?? $doc->assignment_no_ref;

        $contractNumber = $data['documentDetail']['shipmentContractNumber']
            ?? $data['documentReference']['shipmentContractNumber']
            ?? $data['shipment_reference']
            ?? $doc->assignment_no_ref;

        $fileUrl = $doc->file_path ? Storage::url($doc->file_path) : null;
        $previewUrl = route('verifikasi-berkas.file', ['document' => $doc->id]);

        $uploadedBy = $doc->uploadedBy?->name
            ?? $doc->customer?->pic_name
            ?? 'Customer';

        $uploadDate = $doc->uploaded_at
            ? $doc->uploaded_at->format('d M Y')
            : ($doc->created_at ? $doc->created_at->format('d M Y') : date('d M Y'));

        $timeAgo = $doc->uploaded_at
            ? $doc->uploaded_at->diffForHumans()
            : ($doc->created_at ? $doc->created_at->diffForHumans() : 'Just now');

        $verifiedAt = $doc->verified_at
            ? $doc->verified_at->format('d M Y H:i') . ' WIB'
            : null;

        return [
            'id'                     => (string) $doc->id,
            'assignmentNoRef'        => $doc->assignment_no_ref,
            'documentNumber'         => (string) $documentNumber,
            'documentType'           => $docType,
            'title'                  => $doc->file_name ? $doc->file_name : "{$docType} - {$documentNumber}",
            'uploadedBy'             => $uploadedBy,
            'customerName'           => $doc->customer?->company_name ?? 'Unknown Customer',
            'uploadDate'             => $uploadDate,
            'timeAgo'                => $timeAgo,
            'shipmentReference'      => $doc->assignment_no_ref,
            'status'                 => $uiStatus,
            'rawStatus'              => $rawStatus,
            'notes'                  => $doc->remarks,
            'rejectionReason'        => strtoupper($rawStatus) === 'REJECTED' ? $doc->remarks : null,
            'verifiedBy'             => $doc->verifiedBy?->name,
            'verifiedAt'             => $verifiedAt,
            'fileUrl'                => $fileUrl,
            'previewUrl'             => $previewUrl,
            'fileName'               => $doc->file_name,
            'contractNumber'         => $contractNumber,
            'shipper'                => $data['shipper'] ?? null,
            'consignee'              => $data['consignee'] ?? null,
            'notifyParty'            => $data['notifyParty'] ?? null,
            'transportDetail'        => $data['transportDetail'] ?? null,
            'cargoDetails'           => $data['cargoDetail'] ?? null,
            'totals'                 => $data['totalQuantity'] ?? $data['quantity'] ?? null,
            'relatedDocumentNumbers' => $data['documentReference'] ?? $data['commercialInvoiceRef'] ?? null,
            'amountInsured'          => $data['insurance']['amountInsured'] ?? null,
        ];
    }
}