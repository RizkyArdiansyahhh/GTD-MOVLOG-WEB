<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Web\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\Web\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Web\CustomerDashboardController;
use App\Http\Controllers\Web\GlobalSearchController;
use App\Http\Controllers\Web\KelolaAkunController;
use App\Http\Controllers\Web\LaporanController;
use App\Http\Controllers\Web\MonitoringBarangController;
use App\Http\Controllers\Web\MonitoringCheckpointController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\ReportTemplateController;
use App\Http\Controllers\Web\SesiPekerjaController;
use App\Http\Controllers\Web\SubmitBerkasController;
use App\Http\Controllers\Web\SupportController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\VerifikasiBerkasController;
use App\Models\Checkpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — Logistics Management System (Inertia.js + React + TS)
|--------------------------------------------------------------------------
*/

// Landing Page
Route::get('/welcome', fn () => view('welcome'))->name('welcome');

// ============================
// Guest Routes
// ============================
Route::middleware('guest')->group(function () {
    Route::get('login', fn () => Inertia::render('Auth/Login'))
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->name('login.store');
});

// Support & System Guide Routes (Public & Authenticated)
Route::get('/pusat-bantuan', [SupportController::class, 'helpCenter'])
    ->name('pusat-bantuan');
Route::get('/panduan', [SupportController::class, 'systemGuide'])
    ->name('panduan');

// English Aliases for Support & Guides
Route::get('/help-center', [SupportController::class, 'helpCenter'])
    ->name('help-center');
Route::get('/system-guide', [SupportController::class, 'systemGuide'])
    ->name('system-guide');

// ============================
// Authenticated Routes
// ============================
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard (Admin / Staff / Customer Redirect)
    Route::get('/', function (Request $request) {
        if ($request->user()?->hasRole('customer')) {
            return redirect()->route('customer.dashboard');
        }

        $stats = [
            'total_users' => User::count(),
            'total_shipments' => ShippingSession::count(),
            'active_drivers' => User::whereHas('roles', fn ($q) => $q->where('name', 'field-worker'))->count(),
            'pending_deliveries' => ShippingSession::whereIn('status', ['in_transitS', 'pending'])->count(),
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentSessions' => ShippingSession::with(['customer', 'currentCheckpoint'])->latest()->take(5)->get(),
            'masterCheckpoints' => Checkpoint::orderBy('sequence')->get(),
        ]);
    })->name('dashboard');

    Route::get('/dashboard', fn () => redirect()->route('dashboard'));

    // Global Search Endpoints
    Route::get('global-search/quick', [GlobalSearchController::class, 'quick'])
        ->name('global-search.quick');
    Route::get('search', [GlobalSearchController::class, 'index'])
        ->name('global-search.index');

    // Internal Profile Management (Staff, Supervisor, Super Admin, Field Worker)
    Route::get('/profil', [ProfileController::class, 'edit'])
        ->name('profile.edit');
    Route::post('/profil', [ProfileController::class, 'update'])
        ->name('profile.update');
    Route::put('/profil/password', [ProfileController::class, 'updatePassword'])
        ->name('profile.password.update');
    Route::get('/profile', fn () => redirect()->route('profile.edit'));

    // --- Super Admin Routes --------------------------------------------
    Route::middleware('role:super-admin')->group(function () {
        // Kelola Akun
        Route::get('kelola-akun', [KelolaAkunController::class, 'index'])
            ->name('kelola-akun');
        Route::get('kelola-akun/companies', [KelolaAkunController::class, 'getCompanies'])
            ->name('kelola-akun.companies');
        Route::get('kelola-akun/tambah', [KelolaAkunController::class, 'create'])
            ->name('kelola-akun.create');
        Route::post('kelola-akun/tambah', [KelolaAkunController::class, 'store'])
            ->name('kelola-akun.store');
        Route::patch('kelola-akun/{user}/status', [KelolaAkunController::class, 'toggleStatus'])
            ->name('kelola-akun.toggle-status');
    });

    // --- Kelola Sesi Pekerja (Super Admin & Staff) --------------------
    Route::middleware('role:super-admin|staff')->group(function () {
        Route::get('sesi-pekerja', [SesiPekerjaController::class, 'index'])
            ->name('sesi-pekerja');
        Route::get('sesi-pekerja/tambah', [SesiPekerjaController::class, 'create'])
            ->name('sesi-pekerja.create');
        Route::post('sesi-pekerja', [SesiPekerjaController::class, 'store'])
            ->name('sesi-pekerja.store');

        // Master Template Laporan
        Route::resource('template-laporan', ReportTemplateController::class)->except(['show']);

        // Aliases for kelola-sesi
        Route::get('kelola-sesi', [SesiPekerjaController::class, 'index'])
            ->name('kelola-sesi');
        Route::get('kelola-sesi/create', [SesiPekerjaController::class, 'create'])
            ->name('kelola-sesi.create');
        Route::post('kelola-sesi', [SesiPekerjaController::class, 'store'])
            ->name('kelola-sesi.store');
    });

    // --- Supervisor Routes --------------------------------------------
    Route::middleware('role:supervisor')->group(function () {
        // Verifikasi Berkas
        Route::get('verifikasi-berkas', [VerifikasiBerkasController::class, 'index'])
            ->name('verifikasi-berkas');
        Route::get('verifikasi-berkas/{contractNumber}', [VerifikasiBerkasController::class, 'show'])
            ->name('verifikasi-berkas.show');
        Route::post('verifikasi-berkas/{document}/verify', [VerifikasiBerkasController::class, 'verify'])
            ->name('verifikasi-berkas.verify');
        Route::post('verifikasi-berkas/{document}/reject', [VerifikasiBerkasController::class, 'reject'])
            ->name('verifikasi-berkas.reject');
        Route::get('verifikasi-berkas/file/{document}', [VerifikasiBerkasController::class, 'serveFile'])
            ->name('verifikasi-berkas.file');
    });

    // User Management
    Route::resource('users', UserController::class);

    // Sesi Pekerja Operations
    Route::get('sesi-pekerja/{session}', [SesiPekerjaController::class, 'show'])
        ->name('sesi-pekerja.show');

    Route::post('sesi-pekerja/{session}/assign-all', [SesiPekerjaController::class, 'assignAllStages'])
        ->name('sesi-pekerja.assign-all');

    Route::post('sesi-pekerja/{session}/stages/{stage}/assign', [SesiPekerjaController::class, 'assignStage'])
        ->name('sesi-pekerja.stages.assign');

    Route::post('sesi-pekerja/{session}/stages/{stage}/complete', [SesiPekerjaController::class, 'completeStage'])
        ->name('sesi-pekerja.stages.complete');

    // Movement & Report Operations for Web Admin
    Route::post('sesi-pekerja/{session}/stages/{stage}/movements', [SesiPekerjaController::class, 'storeMovement'])
        ->name('sesi-pekerja.stages.movements.store');

    Route::delete('sesi-pekerja/{session}/movements/{movement}', [SesiPekerjaController::class, 'deleteMovement'])
        ->name('sesi-pekerja.movements.destroy');

    Route::post('sesi-pekerja/{session}/stages/{stage}/movements/{movement}/reports', [SesiPekerjaController::class, 'saveReport'])
        ->name('sesi-pekerja.stages.movements.reports.save');

    Route::post('sesi-pekerja/{session}/stages/{stage}/movements/{movement}/complete-report', [SesiPekerjaController::class, 'completeReport'])
        ->name('sesi-pekerja.stages.movements.reports.complete');

    // --- Internal Operational Routes (Super Admin, Staff, Supervisor) ---
    Route::middleware('role:super-admin|staff|supervisor')->group(function () {
        // Monitoring Barang
        Route::get('monitoring-barang', [MonitoringBarangController::class, 'index'])
            ->name('monitoring-barang.index');

        // Monitoring Checkpoint
        Route::prefix('monitoring-checkpoint')->group(function () {
            Route::get('/', [MonitoringCheckpointController::class, 'index'])
                ->name('monitoring-checkpoint.index');

            Route::get('/{assignmentNo}', [MonitoringCheckpointController::class, 'show'])
                ->name('monitoring-checkpoint.show');
        });

        // Submit Berkas
        Route::prefix('submit-berkas')
            ->name('submit-berkas.')
            ->controller(SubmitBerkasController::class)
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/customers', 'storeCustomer')->name('customers.store');
                Route::post('/start', 'startAssignment')->name('start');
                Route::post('/step', 'saveStep')->name('save-step');
                Route::get('/{assignmentNoRef}', 'show')->name('show');
                Route::post('/{assignmentNoRef}/finalize', 'finalize')->name('finalize');
                Route::get('{assignmentNoRef}/status', 'status')->name('status');
            });
        Route::get('submit-document', fn () => redirect()->route('submit-berkas.index'));

        // Laporan & Reports
        Route::get('laporan', [LaporanController::class, 'index'])
            ->name('laporan.index');
        Route::get('reports', [LaporanController::class, 'index'])
            ->name('reports.index');
        Route::get('report', [LaporanController::class, 'index'])
            ->name('report.index');

        Route::get('checkpoint-monitoring', fn () => redirect()->route('monitoring-checkpoint.index'));
        Route::get('shipments', fn () => redirect()->route('monitoring-barang.index'));
    });

    Route::get('drivers', fn () => redirect()->route('kelola-akun'));

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

// ============================
// Customer Portal Routes
// ============================
Route::middleware(['auth', 'verified', 'role:customer'])->prefix('customer')->name('customer.')->group(function () {

    Route::get('/', [CustomerDashboardController::class, 'index'])
        ->name('index');

    Route::get('/dashboard', [CustomerDashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/monitoring-barang', [CustomerDashboardController::class, 'monitoring'])
        ->name('monitoring');

    Route::get('/monitoring-barang/{id}', [CustomerDashboardController::class, 'detail'])
        ->name('monitoring.detail');

    Route::get('/checkpoints', [CustomerDashboardController::class, 'checkpoints'])
        ->name('checkpoints');

    Route::get('/shipment/{id}', [CustomerDashboardController::class, 'detail'])
        ->name('shipment.detail');

    // Customer Profile Management
    Route::get('/profil', [CustomerProfileController::class, 'edit'])
        ->name('profile.edit');
    Route::post('/profil', [CustomerProfileController::class, 'update'])
        ->name('profile.update');
    Route::put('/profil/password', [CustomerProfileController::class, 'updatePassword'])
        ->name('profile.password.update');
    Route::get('/profile', fn () => redirect()->route('customer.profile.edit'));

    // Customer Notifications
    Route::get('/notifications', [CustomerNotificationController::class, 'index'])
        ->name('notifications.index');
    Route::post('/notifications/{id}/read', [CustomerNotificationController::class, 'markAsRead'])
        ->name('notifications.read');
    Route::post('/notifications/read-all', [CustomerNotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');

    // Customer Support & System Guide
    Route::get('/pusat-bantuan', [SupportController::class, 'helpCenter'])
        ->name('pusat-bantuan');
    Route::get('/panduan', [SupportController::class, 'systemGuide'])
        ->name('panduan');
    Route::get('/help-center', [SupportController::class, 'helpCenter'])
        ->name('help-center');
    Route::get('/system-guide', [SupportController::class, 'systemGuide'])
        ->name('system-guide');
});
