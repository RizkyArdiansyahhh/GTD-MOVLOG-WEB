<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringBarangController extends Controller
{
    /**
     * Display the Monitoring Barang page.
     */
    public function index(): Response
    {
        return Inertia::render('MonitoringBarang/MonitoringBarang');
    }
}
