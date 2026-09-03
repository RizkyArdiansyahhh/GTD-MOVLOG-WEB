<?php

use App\Exceptions\BusinessException;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // ─── Inertia & Account Status middleware ──────────────────────────
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'idempotent' => \App\Http\Middleware\HandleIdempotency::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'kelola-akun/*/status',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // ─── JSON exceptions for API routes ───────────────────────────────

        // Business rule violations (from Services)
        $exceptions->render(function (BusinessException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success'    => false,
                    'message'    => $e->getMessage(),
                    'error_code' => 'BUSINESS_RULE_VIOLATION',
                ], 422);
            }
        });

        // Model not found → 404
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'Resource not found.',
                    'error_code' => 'NOT_FOUND',
                ], 404);
            }
        });

        // Validation errors → 422
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'The given data was invalid.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        // Unauthenticated → 401
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'Unauthenticated.',
                    'error_code' => 'UNAUTHENTICATED',
                ], 401);
            }
        });

        // HTTP Exceptions (403, 404, etc.)
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = $e->getStatusCode();
                $errorCode = match ($status) {
                    403     => 'FORBIDDEN',
                    404     => 'NOT_FOUND',
                    400     => 'BAD_REQUEST',
                    405     => 'METHOD_NOT_ALLOWED',
                    default => 'HTTP_ERROR',
                };

                return response()->json([
                    'success'    => false,
                    'message'    => $e->getMessage() ?: match ($status) {
                        403     => 'Forbidden.',
                        404     => 'Resource not found.',
                        default => 'An error occurred.',
                    },
                    'error_code' => $errorCode,
                ], $status);
            }
        });
    })->create();
