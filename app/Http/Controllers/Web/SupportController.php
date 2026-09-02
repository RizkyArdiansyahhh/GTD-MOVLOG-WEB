<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    /**
     * Display the Help Center page.
     */
    public function helpCenter(Request $request): Response
    {
        return Inertia::render('Support/HelpCenter');
    }

    /**
     * Display the System Guide page.
     */
    public function systemGuide(Request $request): Response
    {
        return Inertia::render('Support/SystemGuide');
    }
}
