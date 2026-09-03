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

        // Sessions & Checkpoints (Phase 5D API & Phase 5H Complete)
        Route::get('sessions', [\App\Http\Controllers\Api\SessionApiController::class, 'index'])->name('sessions.index');
        Route::get('sessions/{session}', [\App\Http\Controllers\Api\SessionApiController::class, 'show'])->name('sessions.show');
        Route::get('sessions/{session}/checkpoints/{checkpoint}', [\App\Http\Controllers\Api\CheckpointApiController::class, 'show'])->name('sessions.checkpoints.show');
        Route::post('sessions/{session}/checkpoints/{checkpoint}/complete', [\App\Http\Controllers\Api\CheckpointApiController::class, 'complete'])->middleware('idempotent')->name('sessions.checkpoints.complete');

        // Movements (Phase 5E Movement API & Phase 5J.1 Update)
        Route::get('sessions/{session}/checkpoints/{checkpoint}/movements', [\App\Http\Controllers\Api\MovementApiController::class, 'index'])->name('sessions.checkpoints.movements.index');
        Route::post('sessions/{session}/checkpoints/{checkpoint}/movements', [\App\Http\Controllers\Api\MovementApiController::class, 'store'])->middleware('idempotent')->name('sessions.checkpoints.movements.store');
        Route::match(['put', 'patch'], 'sessions/{session}/movements/{movement}', [\App\Http\Controllers\Api\MovementApiController::class, 'update'])->middleware('idempotent')->name('sessions.movements.update');
        Route::delete('sessions/{session}/movements/{movement}', [\App\Http\Controllers\Api\MovementApiController::class, 'destroy'])->name('sessions.movements.destroy');

        // Reports (Phase 5F Report API)
        Route::get('sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report', [\App\Http\Controllers\Api\ReportApiController::class, 'show'])->name('sessions.checkpoints.movements.report.show');
        Route::post('sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report', [\App\Http\Controllers\Api\ReportApiController::class, 'store'])->middleware('idempotent')->name('sessions.checkpoints.movements.report.store');
        Route::post('sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report/complete', [\App\Http\Controllers\Api\ReportApiController::class, 'complete'])->middleware('idempotent')->name('sessions.checkpoints.movements.report.complete');

        // Report Photos (Phase 5G Photo API)
        Route::post('sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report/photos', [\App\Http\Controllers\Api\ReportPhotoApiController::class, 'store'])->middleware('idempotent')->name('sessions.checkpoints.movements.report.photos.store');
        Route::delete('sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report/photos/{photo}', [\App\Http\Controllers\Api\ReportPhotoApiController::class, 'destroy'])->name('sessions.checkpoints.movements.report.photos.destroy');
    });

    // ─── Testing-only foundation test probes ──────────────────────────────
    if (app()->environment('testing')) {
        Route::prefix('test-foundation')->group(function () {
            Route::post('business-exception', function () {
                throw new \App\Exceptions\BusinessException('Operasi melanggar aturan bisnis domain.');
            });
            Route::get('forbidden', function () {
                abort(403, 'Akses ditolak untuk peran ini.');
            });
            Route::get('success-envelope', function () {
                return response()->json([
                    'success' => true,
                    'message' => 'Foundation probe success.',
                    'data'    => ['status' => 'operational'],
                ]);
            });
        });
    }
});
