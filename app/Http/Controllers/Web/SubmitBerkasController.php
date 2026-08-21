<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SubmitBerkasController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SubmitBerkas/SubmitBerkas');
    }

        public function finalize(Request $request)
    {
        $submission = Submission::create([
            'user_id' => auth()->id(),
            'status' => 'pending',
            'data' => $request->all(), // atau field terpisah sesuai schema kamu
            'submitted_at' => now(),
        ]);

        return redirect()->route('submit-berkas.status', $submission->id);
    }

        public function status(Submission $submission)
    {
        return Inertia::render('SubmitBerkas/Status', [
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'submittedAt' => $submission->submitted_at->format('d M Y, H:i'),
                'rejectionReason' => $submission->rejection_reason,
                'data' => $submission->data,
            ],
        ]);
    }
}