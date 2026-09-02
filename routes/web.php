<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Web\Auth\RegisteredUserController;
use App\Http\Controllers\Web\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\Web\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Web\CustomerDashboardController;
use App\Http\Controllers\Web\GlobalSearchController;
use App\Http\Controllers\Web\KelolaAkunController;
use App\Http\Controllers\Web\LaporanController;
use App\Http\Controllers\Web\MonitoringBarangController;
use App\Http\Controllers\Web\MonitoringCheckpointController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\SesiPekerjaController;
use App\Http\Controllers\Web\SubmitBerkasController;
use App\Http\Controllers\Web\SupportController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\VerifikasiBerkasController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/welcome', fn () => view('welcome'))->name('welcome');

Route::middleware('guest')->group(function () {
    Route::get('login', fn () => Inertia::render('Auth/Login'))
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->name('login.store');

    Route::get('register', fn () => Inertia::render('Auth/Register'))
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->name('register.store');
});

// Support & System Guide Routes (Public & Authenticated)
Route::get('/pusat-bantuan', [SupportController::class, 'helpCenter'])
    ->name('pusat-bantuan');
Route::get('/panduan', [SupportController::class, 'systemGuide'])
    ->name('panduan');

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard (Admin / Staff / Customer Redirect)
    Route::get('/', function (\Illuminate\Http\Request $request) {
        if ($request->user()?->hasRole('customer')) {
            return redirect()->route('customer.dashboard');
        }

        $stats = [
            'total_users'        => \App\Models\User::count(),
            'total_shipments'    => \App\Models\ShippingSession::count(),
            'active_drivers'     => \App\Models\User::whereHas('roles', fn ($q) => $q->where('name', 'field-worker'))->count(),
            'pending_deliveries' => \App\Models\ShippingSession::whereIn('status', ['in_transitS', 'pending'])->count(),
        ];
        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentSessions' => \App\Models\ShippingSession::with(['customer', 'currentCheckpoint'])->latest()->take(5)->get(),
            'masterCheckpoints' => \App\Models\Checkpoint::orderBy('sequence')->get(),
        ]);
    })->name('dashboard');

    // Customer Portal Routes
    Route::middleware('role:customer')->prefix('customer')->name('customer.')->group(function () {
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
    });

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

    // --- Super Admin Routes --------------------------------------------
    Route::middleware('role:super-admin')->group(function () {
        // Kelola Akun
        Route::get('kelola-akun', [KelolaAkunController::class, 'index'])
            ->name('kelola-akun');
        Route::get('kelola-akun/tambah', [KelolaAkunController::class, 'create'])
            ->name('kelola-akun.create');
        Route::post('kelola-akun/tambah', [KelolaAkunController::class, 'store'])
            ->name('kelola-akun.store');
        Route::patch('kelola-akun/{user}/status', [KelolaAkunController::class, 'toggleStatus'])
            ->name('kelola-akun.toggle-status');

        // Kelola Sesi Pekerja
        Route::get('sesi-pekerja', [SesiPekerjaController::class, 'index'])
            ->name('sesi-pekerja');
        Route::get('sesi-pekerja/tambah', [SesiPekerjaController::class, 'create'])
            ->name('sesi-pekerja.create');
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

    Route::resource('users', UserController::class);

    // Sesi Pekerja Operations
    Route::post('sesi-pekerja', [SesiPekerjaController::class, 'store'])
        ->name('sesi-pekerja.store');

    Route::get('sesi-pekerja/{session}', [SesiPekerjaController::class, 'show'])
        ->name('sesi-pekerja.show');

    Route::post('sesi-pekerja/{session}/stages/{stage}/assign', [SesiPekerjaController::class, 'assignStage'])
        ->name('sesi-pekerja.stages.assign');

    Route::post('sesi-pekerja/{session}/stages/{stage}/complete', [SesiPekerjaController::class, 'completeStage'])
        ->name('sesi-pekerja.stages.complete');

    // Monitoring Barang
    Route::get('monitoring-barang', [MonitoringBarangController::class, 'index'])
        ->name('monitoring-barang.index');

    // Laporan
    Route::get('laporan', [LaporanController::class, 'index'])
        ->name('laporan.index');

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
    
    Route::prefix('monitoring-checkpoint')->group(function () {
    Route::get('/', [MonitoringCheckpointController::class, 'index'])
        ->name('monitoring-checkpoint.index');

    Route::get('/{assignmentNo}', [MonitoringCheckpointController::class, 'show'])
        ->name('monitoring-checkpoint.show');
    });

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
