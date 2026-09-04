<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfilePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the internal profile edit page.
     */
    public function edit(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // If a customer accesses this route, redirect to customer profile
        if ($user?->hasRole('customer')) {
            return redirect()->route('customer.profile.edit');
        }

        $roles = $user->roles->map(fn ($r) => [
            'name'  => (string) $r->name,
            'label' => UserRole::tryFrom($r->name)?->label() ?? ucwords(str_replace('-', ' ', (string) $r->name)),
        ])->values()->all();

        $statusValue = $user->status instanceof UserStatus ? $user->status->value : (string) ($user->status ?? 'active');
        $statusLabel = match ($statusValue) {
            'active' => 'Aktif',
            'inactive' => 'Nonaktif',
            default => 'Menunggu Verifikasi',
        };

        return Inertia::render('Profile/Edit', [
            'profile' => [
                'id'           => (string) $user->id,
                'name'         => (string) $user->name,
                'email'        => (string) $user->email,
                'phone'        => $user->phone,
                'avatar'       => $user->avatar,
                'avatar_url'   => $user->avatar_url,
                'status'       => $statusValue,
                'status_label' => $statusLabel,
                'roles'        => $roles,
                'created_at'   => $user->created_at?->format('d M Y') ?? '-',
            ],
        ]);
    }

    /**
     * Update internal profile details.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->name = $validated['name'];
        $user->phone = $validated['phone'] ?? null;

        // Handle Avatar Deletion
        if ($request->boolean('delete_avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = null;
        } elseif ($request->hasFile('avatar')) {
            // Handle New Avatar Upload
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        return back()->with('success', 'Profil internal Anda berhasil diperbarui.');
    }

    /**
     * Update internal account password.
     */
    public function updatePassword(UpdateProfilePasswordRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->password = Hash::make($validated['password']);
        $user->save();

        return back()->with('success', 'Password akun Anda berhasil diperbarui.');
    }
}
