<?php

declare(strict_types=1);

use App\Http\Controllers\Web\KelolaAkunController;
use App\Http\Controllers\Web\LaporanController;
use App\Http\Controllers\Web\MonitoringBarangController;
use App\Http\Controllers\Web\SesiPekerjaController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\VerifikasiBerkasController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — Admin Dashboard (Inertia.js + React + TypeScript)
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

    Route::post('login', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'store'])
        ->name('login.store');

});

// ============================
// Authenticated Routes
// ============================
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/', fn () => Inertia::render('Dashboard/Index'))
        ->name('dashboard');

    // ============================
    // Kelola Akun
    // ============================
    Route::get('kelola-akun', [KelolaAkunController::class, 'index'])
        ->name('kelola-akun');

    Route::get('kelola-akun/tambah', [KelolaAkunController::class, 'create'])
        ->name('kelola-akun.create');

    Route::post('kelola-akun/tambah', [KelolaAkunController::class, 'store'])
        ->name('kelola-akun.store');

    Route::patch('kelola-akun/{user}/status', [KelolaAkunController::class, 'toggleStatus'])
        ->name('kelola-akun.toggle-status');

    // ============================
    // Kelola Sesi
    // ============================
    Route::get('kelola-sesi', [SesiPekerjaController::class, 'index'])
        ->name('kelola-sesi');

    Route::get('kelola-sesi/create', [SesiPekerjaController::class, 'create'])
        ->name('kelola-sesi.create');

    Route::post('kelola-sesi', [SesiPekerjaController::class, 'store'])
        ->name('kelola-sesi.store');

    // ============================
    // User Management
    // ============================
    Route::resource('users', UserController::class);

    // ============================
    // Verifikasi Berkas
    // ============================
    Route::get('verifikasi-berkas', [VerifikasiBerkasController::class, 'index'])
        ->name('verifikasi-berkas');

    // ============================
    // Monitoring Barang
    // ============================
    Route::get('monitoring-barang', [MonitoringBarangController::class, 'index'])
        ->name('monitoring-barang.index');

    // ============================
    // Laporan
    // ============================
    Route::get('laporan', [LaporanController::class, 'index'])
        ->name('laporan.index');

    // Logout
    Route::post('logout', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
// ============================
// Customer Portal Routes
// ============================
Route::middleware(['auth', 'verified', 'role:customer'])->prefix('customer')->name('customer.')->group(function () {

    Route::get('/', [\App\Http\Controllers\Web\CustomerDashboardController::class, 'index'])
        ->name('index');

    Route::get('/dashboard', [\App\Http\Controllers\Web\CustomerDashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/monitoring-barang', [\App\Http\Controllers\Web\CustomerDashboardController::class, 'monitoring'])
        ->name('monitoring');

    Route::get('/monitoring-barang/{id}', [\App\Http\Controllers\Web\CustomerDashboardController::class, 'detail'])
        ->name('monitoring.detail');

    Route::get('/checkpoints', [\App\Http\Controllers\Web\CustomerDashboardController::class, 'checkpoints'])
        ->name('checkpoints');

    Route::get('/shipment/{id}', [\App\Http\Controllers\Web\CustomerDashboardController::class, 'detail'])
        ->name('shipment.detail');

    // Customer Profile Management
    Route::get('/profil', [\App\Http\Controllers\Web\Customer\ProfileController::class, 'edit'])
        ->name('profile.edit');
    Route::post('/profil', [\App\Http\Controllers\Web\Customer\ProfileController::class, 'update'])
        ->name('profile.update');
    Route::put('/profil/password', [\App\Http\Controllers\Web\Customer\ProfileController::class, 'updatePassword'])
        ->name('profile.password.update');

    // Customer Notifications
    Route::get('/notifications', [\App\Http\Controllers\Web\Customer\NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Web\Customer\NotificationController::class, 'markAsRead'])
        ->name('notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\Web\Customer\NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
});
