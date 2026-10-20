<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Enums\UserRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\ResponseFactory;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class WebErrorResponse
{
    public function __invoke(Response $response, Throwable $exception, Request $request): Response
    {
        $status = $response->getStatusCode();

        if (app()->environment('local')
            || $request->is('api', 'api/*')
            || $request->expectsJson()
            || $response instanceof JsonResponse
            || ! in_array($status, [403, 404, 419, 429, 500, 503], true)) {
            return $response;
        }

        $home = $this->home($request);

        // Only failed mutations redirect. A GET that also returns 419 renders
        // the fallback page, so a broken destination cannot create a loop.
        if ($status === 419 && ! $request->isMethodSafe() && $request->hasSession()) {
            $target = $this->previousPage($request) ?? $home;

            return redirect()->to($target, 303)->with([
                'error' => 'Sesi berakhir, silakan coba lagi.',
                'error_id' => (string) Str::uuid(),
            ]);
        }

        // A fresh factory deliberately excludes shared auth, notification and
        // deferred props: one of those may be the source of the exception.
        $inertia = new ResponseFactory;
        $inertia->version((new HandleInertiaRequests)->version($request));
        $error = $inertia->render('Error', [
            'status' => $inertia->always($status),
            'home' => $inertia->always($home),
            'flash' => $inertia->always($request->hasSession() ? [
                'error' => $request->session()->get('error'),
                'error_id' => $request->session()->get('error_id'),
            ] : null),
        ])->toResponse($request)->setStatusCode($status);

        // Keep throttling/maintenance guidance, without copying the original
        // body or its content headers into the new response.
        foreach (['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'] as $header) {
            if ($response->headers->has($header)) {
                $error->headers->set($header, $response->headers->get($header));
            }
        }
        $error->setVary('X-Inertia', false);
        $error->headers->set('Cache-Control', 'no-store, private');

        return $error;
    }

    private function home(Request $request): string
    {
        $route = 'login';

        try {
            $user = $request->user();
            if ($user?->isActive()) {
                if ($user->hasRole(UserRole::Customer->value)) {
                    $route = 'customer.dashboard';
                } elseif ($user->hasAnyRole([
                    UserRole::SuperAdmin->value,
                    UserRole::Supervisor->value,
                    UserRole::Staff->value,
                    UserRole::FieldWorker->value,
                ])) {
                    // The internal dashboard is available to these roles.
                    $route = 'dashboard';
                }
            }
        } catch (Throwable) {
            // Auth/role storage may itself be unavailable. Do not retry it.
        }

        $home = route($route, [], false);

        // Do not send the user straight back to the dashboard/login that
        // failed. The existing welcome page has no auth/shared-prop queries.
        return $request->getPathInfo() === $home ? route('welcome', [], false) : $home;
    }

    private function previousPage(Request $request): ?string
    {
        $previous = $request->headers->get('referer') ?: $request->session()->previousUrl();
        if (! is_string($previous) || str_contains($previous, '\\')) {
            return null;
        }

        if (str_starts_with($previous, '/') && ! str_starts_with($previous, '//')) {
            $previous = $request->getSchemeAndHttpHost().$previous;
        }

        try {
            $candidate = Request::create($previous, 'GET');
            if ($candidate->getSchemeAndHttpHost() !== $request->getSchemeAndHttpHost()
                || $candidate->is('api', 'api/*')
                || $candidate->getUser() !== null
                || $candidate->getPassword() !== null) {
                return null;
            }

            // Validate GET support without running any controller/middleware.
            app('router')->getRoutes()->match($candidate);

            return $candidate->getRequestUri();
        } catch (Throwable) {
            return null;
        }
    }
}
