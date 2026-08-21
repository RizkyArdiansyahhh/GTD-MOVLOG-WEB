<?php

declare(strict_types=1);

use App\Http\Controllers\Web\MonitoringBarangController;
use App\Http\Controllers\Web\LaporanController;
use App\Http\Controllers\Web\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\SubmitBerkasController;
use Inertia\Inertia;

Route::get('/welcome', fn () => view('welcome'))->name('welcome');

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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', fn () => Inertia::render('Dashboard/Index'))
        ->name('dashboard');

    Route::resource('users', UserController::class);

    Route::get('monitoring-barang', [MonitoringBarangController::class, 'index'])
        ->name('monitoring-barang.index');

    Route::get('laporan', [LaporanController::class, 'index'])
        ->name('laporan.index');

    Route::post('logout', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::get('submit-dokumen', [SubmitBerkasController::class, 'index'])->name('submit-dokumen');
    Route::post('/submit-berkas/finalize', [SubmitBerkasController::class, 'finalize'])->name('submit-berkas.finalize');
    Route::get('/submit-berkas/status/{submission}', [SubmitBerkasController::class, 'status'])->name('submit-berkas.status');
});
