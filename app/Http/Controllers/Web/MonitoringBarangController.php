<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\MonitoringBarangService;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringBarangController extends Controller
{
    public function __construct(
        private MonitoringBarangService $monitoringBarangService
    ) {}

    /**
     * Display the Monitoring Barang page with real document data.
     */
    public function index(): Response
    {
        $items = $this->monitoringBarangService->getMonitoringItems();

        return Inertia::render('MonitoringBarang/MonitoringBarang', [
            'items' => $items,
        ]);
    }
}
