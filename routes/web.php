<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Web\Auth\RegisteredUserController;
use App\Http\Controllers\Web\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\Web\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Web\CustomerDashboardController;
use App\Http\Controllers\Web\GlobalSearchController;
use App\Http\Controllers\Web\KelolaAkunController;
use App\Http\Controllers\Web\SesiPekerjaController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\VerifikasiBerkasController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — GTD-MoveLog (Inertia.js + React + TypeScript)
|--------------------------------------------------------------------------
|
| Authentication: Laravel Session (web guard)
| Authorization : Laravel Policy + Spatie Permission
|
|--------------------------------------------------------------------------
*/

Route::get('/welcome', fn () => view('welcome'))->name('welcome');

// --- Guest routes ---------------------------------------------------------
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

// --- Authenticated routes --------------------------------------------------
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
            'pending_deliveries' => \App\Models\ShippingSession::whereIn('status', ['in_transit', 'pending'])->count(),
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
    });

    // Global Search Endpoints
    Route::get('global-search/quick', [GlobalSearchController::class, 'quick'])
        ->name('global-search.quick');
    Route::get('search', [GlobalSearchController::class, 'index'])
        ->name('global-search.index');

    // --- Super Admin Routes -------------------------------------------
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
    });

    // User Management
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

    // Verifikasi Berkas Detail
    Route::get('verifikasi-berkas/{contractNumber}', [VerifikasiBerkasController::class, 'show'])
        ->name('verifikasi-berkas.show');

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
