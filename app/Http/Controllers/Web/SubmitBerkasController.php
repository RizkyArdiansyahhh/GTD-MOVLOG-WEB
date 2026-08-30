<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveDocumentStepRequest;
use App\Models\Customer;
use App\Services\DocumentSubmissionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmitBerkasController extends Controller
{
    public function __construct(
        private DocumentSubmissionService $documentSubmissionService
    ) {}

    /**
     * Tampilkan halaman wizard SubmitBerkas beserta daftar customer.
     */
    public function index(): Response
    {
        return Inertia::render('SubmitBerkas/SubmitBerkas', [
            'customers' => Customer::latest()->get(),
            'assignments' => $this->documentSubmissionService->getAssignmentSummaries(),
        ]);
    }

    /**
     * Simpan customer baru dari AddCustomerModal.
     */
    public function storeCustomer(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address'      => 'nullable|string',
            'phone'        => 'nullable|string|min:10|max:15',
            'email'        => 'nullable|email|max:255',
            'pic_name'     => 'nullable|string|max:255',
        ], [
            'phone.min' => 'Nomor HP minimal 10 karakter.',
            'phone.max' => 'Nomor HP maksimal 15 karakter.',
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'message'  => 'Customer berhasil ditambahkan',
            'customer' => $customer,
        ], 201);
    }

    /**
     * Generate assignment_no_ref baru.
     */
    public function startAssignment(Request $request)
    {
        $ref = $this->documentSubmissionService->generateAssignmentRef();
        return response()->json([
            'assignment_no_ref' => $ref,
        ]);
    }

    /**
     * Simpan satu dokumen per-step.
     */
    public function saveStep(SaveDocumentStepRequest $request)
    {
        $data = $request->validated();

        // Simpan file fisik jika diunggah langsung
        if ($request->hasFile('pdf')) {
            $file = $request->file('pdf');
            $path = $file->store('documents/' . $data['assignment_no_ref'], 'public');
            
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_path'] = $path;
        }

        $document = $this->documentSubmissionService->saveStep(
            $data,
            auth()->id()
        );

        return response()->json($document);
    }

    /**
     * Ambil seluruh dokumen dalam satu assignment.
     */
    public function show(string $assignmentNoRef)
    {
        $documents = $this->documentSubmissionService->getByAssignmentRef($assignmentNoRef);

        return response()->json($documents);
    }

    /**
     * Finalisasi submission di Preview PIB.
     */
   public function finalize(string $assignmentNoRef)
    {
        $this->documentSubmissionService->submitFinal($assignmentNoRef);
        return redirect()
            ->route('submit-berkas.index');
    }

    /**
     * Halaman status hasil submission.
     */
    public function status(string $assignmentNoRef): Response
    {
        $documents = $this->documentSubmissionService->getByAssignmentRef($assignmentNoRef);

        return Inertia::render('SubmitBerkas/Status', [
            'assignmentNoRef' => $assignmentNoRef,
            'documents'       => $documents,
        ]);
    }
}
