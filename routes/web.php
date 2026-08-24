<?php

declare(strict_types=1);

use App\Http\Controllers\Web\KelolaAkunController;
use App\Http\Controllers\Web\SesiPekerjaController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\VerifikasiBerkasController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — Admin Dashboard (Inertia.js + React + TypeScript)
|--------------------------------------------------------------------------
| All routes here serve Inertia responses for the web admin panel.
|
| Authentication: Laravel Session (web guard)
| Authorization : Laravel Policy + Spatie Permission
|
| DO NOT mix API (REST) routes here.
|--------------------------------------------------------------------------
*/

// If you want a landing page that renders welcome.blade.php, you can keep this:
Route::get('/welcome', fn () => view('welcome'))->name('welcome');

// ─── Guest routes ─────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('login', fn () => Inertia::render('Auth/Login'))
        ->name('login');

    Route::post('login', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'store'])
        ->name('login.store');

    Route::get('register', fn () => Inertia::render('Auth/Register'))
        ->name('register');

    Route::post('register', [\App\Http\Controllers\Web\Auth\RegisteredUserController::class, 'store'])
        ->name('register.store');
});

// ─── Authenticated routes ──────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/', fn () => Inertia::render('Dashboard/Index'))
        ->name('dashboard');

    // ─── Super Admin Routes ───────────────────────────────────────────
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
            ->name('kelola-sesi');
        Route::get('sesi-pekerja/tambah', [SesiPekerjaController::class, 'create'])
            ->name('kelola-sesi.create');
    });

    // ─── Supervisor Routes ────────────────────────────────────────────
    Route::middleware('role:supervisor')->group(function () {
        // Verifikasi Berkas
        Route::get('verifikasi-berkas', [VerifikasiBerkasController::class, 'index'])
            ->name('verifikasi-berkas');
    });

    // User Management
    Route::resource('users', UserController::class);

    // Verifikasi Berkas
    Route::get('verifikasi-berkas', [VerifikasiBerkasController::class, 'index'])
        ->name('verifikasi-berkas');

    // Kelola Sesi Pekerja
    Route::get('sesi-pekerja', [SesiPekerjaController::class, 'index'])
        ->name('sesi-pekerja');
    Route::get('sesi-pekerja/tambah', [SesiPekerjaController::class, 'create'])
        ->name('sesi-pekerja.create');
    Route::post('sesi-pekerja', [SesiPekerjaController::class, 'store'])
        ->name('sesi-pekerja.store');
    Route::get('sesi-pekerja/{session}', [SesiPekerjaController::class, 'show'])
        ->name('sesi-pekerja.show');
    Route::post('sesi-pekerja/{session}/stages/{stage}/assign', [SesiPekerjaController::class, 'assignStage'])
        ->name('sesi-pekerja.stages.assign');
    Route::post('sesi-pekerja/{session}/stages/{stage}/complete', [SesiPekerjaController::class, 'completeStage'])
        ->name('sesi-pekerja.stages.complete');
    Route::get('verifikasi-berkas/{contractNumber}', [VerifikasiBerkasController::class, 'show'])
        ->name('verifikasi-berkas.show');

    // Logout
    Route::post('logout', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
