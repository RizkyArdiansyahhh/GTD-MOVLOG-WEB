<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdateCustomerPasswordRequest;
use App\Http\Requests\Customer\UpdateCustomerProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the customer profile edit page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $customer = $user?->customer;

        return Inertia::render('Customer/EditProfile', [
            'profile' => [
                'id'         => (string) $user->id,
                'name'       => (string) $user->name,
                'email'      => (string) $user->email,
                'phone'      => $user->phone,
                'avatar'     => $user->avatar,
                'avatar_url' => $user->avatar_url,
                'customer'   => $customer ? [
                    'id'           => (string) $customer->id,
                    'company_name' => (string) $customer->company_name,
                    'pic_name'     => $customer->pic_name,
                    'email'        => $customer->email,
                    'phone'        => $customer->phone,
                ] : null,
            ],
        ]);
    }

    /**
     * Update customer profile details.
     */
    public function update(UpdateCustomerProfileRequest $request): RedirectResponse
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

        return back()->with('success', 'Profil Anda berhasil diperbarui.');
    }

    /**
     * Update customer account password.
     */
    public function updatePassword(UpdateCustomerPasswordRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->password = Hash::make($validated['password']);
        $user->save();

        return back()->with('success', 'Password akun Anda berhasil diperbarui.');
    }
}
