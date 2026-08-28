<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class LaporanController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Laporan/Laporan');
    }
}
