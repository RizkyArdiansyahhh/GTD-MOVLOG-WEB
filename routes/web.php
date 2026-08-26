<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Web\Auth\RegisteredUserController;
use App\Http\Controllers\Web\LaporanController;
use App\Http\Controllers\Web\MonitoringBarangController;
use App\Http\Controllers\Web\SubmitBerkasController;
use App\Http\Controllers\Web\UserController;
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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', fn () => Inertia::render('Dashboard/Index'))
        ->name('dashboard');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::resource('users', UserController::class);

    // Route untuk simpan customer baru dari modal frontend
    Route::post('/customers', [SubmitBerkasController::class, 'storeCustomer'])->name('customers.store');

    Route::get('monitoring-barang', [MonitoringBarangController::class, 'index'])
        ->name('monitoring-barang.index');

    Route::get('laporan', [LaporanController::class, 'index'])
        ->name('laporan.index');

    Route::prefix('submit-berkas')
        ->name('submit-berkas.')
        ->controller(SubmitBerkasController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/customers', 'storeCustomer')->name('customers.store'); // <-- Pindahkan ke sini
            Route::post('/start', 'startAssignment')->name('start');
            Route::post('/step', 'saveStep')->name('save-step');
            Route::get('/{assignmentNoRef}', 'show')->name('show');
            Route::post('/{assignmentNoRef}/finalize', 'finalize')->name('finalize');
            Route::get('/{assignmentNoRef}/status', 'status')->name('status');
        });
    Route::post('/submit-berkas/step', [SubmitBerkasController::class, 'saveStep']);
});