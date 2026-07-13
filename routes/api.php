<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — REST API for Flutter Application
|--------------------------------------------------------------------------
| All routes here are prefixed with /api
| Version prefix: /api/v1
|
| Authentication: Laravel Sanctum (token-based)
| Authorization : Laravel Policy + Spatie Permission
|
| DO NOT mix web (Inertia) routes here.
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->name('api.v1.')->group(function () {

    // ─── Public endpoints (no auth required) ─────────────────────────────
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->name('login');
        Route::post('register', [AuthController::class, 'register'])->name('register');
    });

    // ─── Protected endpoints (Sanctum auth required) ─────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('me', [AuthController::class, 'me'])->name('me');
        });

        // Users
        Route::apiResource('users', UserController::class)->names('users');

    });
});
