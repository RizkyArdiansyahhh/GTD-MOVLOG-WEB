<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;


/**
 * Registered User Controller (Web)
 *
 * Handles web user registration.
 */
class RegisteredUserController extends Controller
{
    /**
     * POST /register
     * Create a new registered user and redirect to login page.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => [
                'required',
                'confirmed',
                'min:8',
                'regex:/[A-Z]/',      // at least one uppercase letter
                'regex:/[0-9]/',      // at least one number
                'regex:/[^A-Za-z0-9]/', // at least one symbol
            ],
            'terms'    => ['accepted'],
        ], [
            'name.required'      => 'Nama lengkap wajib diisi.',
            'email.required'     => 'Email wajib diisi.',
            'email.email'        => 'Format email tidak valid.',
            'email.unique'       => 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
            'password.required'  => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min'       => 'Kata sandi minimal 8 karakter.',
            'password.regex'     => 'Kata sandi harus mengandung huruf kapital, angka, dan simbol.',
            'terms.accepted'     => 'Anda harus menyetujui Syarat & Ketentuan.',
        ]);

        $customer = Customer::firstOrCreate(
            ['email' => $request->email],
            [
                'company_name' => $request->name,
                'pic_name'     => $request->name,
                'email'        => $request->email,
            ]
        );

        $user = User::create([
            'customer_id' => $customer->id,
            'name'        => $request->name,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
        ]);


        if (method_exists($user, 'assignRole') && !$user->roles()->exists()) {
            $user->assignRole(UserRole::Customer->value);
        }

        event(new Registered($user));

        // Do not auto-login, instead redirect to login with a success message
        return redirect()->route('login')->with('success', 'Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.');
    }
}
