<?php

declare(strict_types=1);

use App\Http\Controllers\Web\CustomerDashboardController;
use App\Http\Controllers\Web\UserController;
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

    // Dashboard (Default & Customer Portal)
    Route::get('/', [CustomerDashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/customer', [CustomerDashboardController::class, 'index'])
        ->name('customer.index');

    Route::get('/customer/dashboard', [CustomerDashboardController::class, 'index'])
        ->name('customer.dashboard');

    // Customer Portal Pages
    Route::get('/customer/monitoring-barang', fn () => Inertia::render('Customer/MonitoringBarang'))
        ->name('customer.monitoring-barang');

    Route::get('/customer/checkpoints', fn () => Inertia::render('Customer/Checkpoint'))
        ->name('customer.checkpoints');

    // User Management
    Route::resource('users', UserController::class);

    // Logout
    Route::post('logout', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});