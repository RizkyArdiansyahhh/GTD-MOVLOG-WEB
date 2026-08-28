<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * Handle Inertia Requests
 *
 * Shares global data (auth user, notifications, flash messages) with all Inertia pages.
 * This data is available as `usePage().props` in every React component.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'phone'       => $user->phone,
                    'avatar_url'  => $user->avatar_url,
                    'roles'       => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'customer'    => $user->customer ? [
                        'id'           => $user->customer->id,
                        'company_name' => $user->customer->company_name,
                        'pic_name'     => $user->customer->pic_name,
                        'email'        => $user->customer->email,
                        'phone'        => $user->customer->phone,
                    ] : null,
                ] : null,
            ],
            'notifications' => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'latest'       => $user->notifications()->take(10)->get()->map(fn ($n) => [
                    'id'               => (string) $n->id,
                    'type'             => $n->data['type'] ?? 'general',
                    'title'            => $n->data['title'] ?? 'Notifikasi Kargo',
                    'assignment_no'    => $n->data['assignment_no'] ?? null,
                    'url'              => $n->data['url'] ?? '/customer/monitoring-barang',
                    'read_at'          => $n->read_at?->toISOString(),
                    'created_at'       => $n->created_at?->toISOString(),
                    'created_at_human' => $n->created_at?->diffForHumans(),
                ]),
            ] : null,
            'ziggy' => fn () => [
                ...(new \Tighten\Ziggy\Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
