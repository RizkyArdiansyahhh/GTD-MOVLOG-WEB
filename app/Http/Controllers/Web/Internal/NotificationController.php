<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Internal notification inbox (bell in Navbar — super-admin / staff / supervisor).
 *
 * Mirrors the customer NotificationController read lifecycle exactly:
 * read_at null = unread, opening the dropdown does not mark as read,
 * read rows stay in the database (list is windowed, not deleted).
 */
class NotificationController extends Controller
{
    /**
     * Get latest notifications and unread count for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->take(20)
            ->get()
            ->map(fn ($n) => [
                'id'               => (string) $n->id,
                'type'             => $n->data['type'] ?? 'general',
                'title'            => $n->data['title'] ?? 'Notifikasi',
                'assignment_no'    => $n->data['assignment_no'] ?? null,
                'url'              => $n->data['url'] ?? '/monitoring-barang',
                'read_at'          => $n->read_at?->toISOString(),
                'created_at'       => $n->created_at?->toISOString(),
                'created_at_human' => $n->created_at?->diffForHumans(),
            ]);

        return response()->json([
            'success'       => true,
            'unread_count'  => $user->unreadNotifications()->count(),
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json([
            'success'      => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success'      => true,
            'unread_count' => 0,
        ]);
    }
}
