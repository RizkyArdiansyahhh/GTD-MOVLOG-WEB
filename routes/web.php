<?php

declare(strict_types=1);

use App\Http\Controllers\Web\UserController;
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

// ─── Guest routes ─────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('login', fn () => Inertia::render('Auth/Login'))
        ->name('login');

    Route::post('login', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'store'])
        ->name('login.store');
});

// ─── Authenticated routes ──────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/', fn () => Inertia::render('Dashboard/Index'))
        ->name('dashboard');

    // User Management
    Route::resource('users', UserController::class);

    // Logout
    Route::post('logout', [\App\Http\Controllers\Web\Auth\AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});