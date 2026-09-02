<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InternalProfileTest extends TestCase
{
    use DatabaseTransactions;

    private User $staffUser;
    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'super-admin']);
        Role::firstOrCreate(['name' => 'supervisor']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'customer']);

        $uniq = uniqid();

        $this->staffUser = User::create([
            'name'              => 'Budi Santoso',
            'email'             => "budi_{$uniq}@gtd.co.id",
            'phone'             => '081234567890',
            'password'          => Hash::make('StaffSecret123!'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->staffUser->assignRole('staff');

        $this->adminUser = User::create([
            'name'              => 'Super Administrator',
            'email'             => "admin_{$uniq}@gtd.co.id",
            'phone'             => '081299998888',
            'password'          => Hash::make('AdminSecret123!'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->adminUser->assignRole('super-admin');
    }

    public function test_internal_user_can_view_profile_edit_page(): void
    {
        $response = $this->actingAs($this->staffUser)->get('/profil');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit', false)
                ->has('profile', fn (Assert $p) => $p
                    ->where('id', (string) $this->staffUser->id)
                    ->where('name', 'Budi Santoso')
                    ->where('email', $this->staffUser->email)
                    ->where('phone', '081234567890')
                    ->where('status', 'active')
                    ->where('status_label', 'Aktif')
                    ->has('roles.0', fn (Assert $r) => $r
                        ->where('name', 'staff')
                        ->where('label', 'Staff')
                    )
                    ->has('created_at')
                    ->missing('customer')
                    ->etc()
                )
            );
    }

    public function test_internal_user_can_update_profile_name_and_phone(): void
    {
        $response = $this->actingAs($this->staffUser)->post('/profil', [
            'name'  => 'Budi Santoso S.Kom',
            'phone' => '081299887766',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Profil internal Anda berhasil diperbarui.');

        $this->staffUser->refresh();
        $this->assertEquals('Budi Santoso S.Kom', $this->staffUser->name);
        $this->assertEquals('081299887766', $this->staffUser->phone);
    }

    public function test_internal_user_can_upload_and_delete_avatar(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('staff_avatar.jpg', 300, 300);

        // 1. Upload avatar
        $response = $this->actingAs($this->staffUser)->post('/profil', [
            'name'   => 'Budi Santoso',
            'phone'  => '081234567890',
            'avatar' => $file,
        ]);

        $response->assertRedirect();
        $this->staffUser->refresh();
        $this->assertNotNull($this->staffUser->avatar);
        Storage::disk('public')->assertExists($this->staffUser->avatar);

        // 2. Delete avatar
        $deleteResponse = $this->actingAs($this->staffUser)->post('/profil', [
            'name'          => 'Budi Santoso',
            'phone'         => '081234567890',
            'delete_avatar' => true,
        ]);

        $deleteResponse->assertRedirect();
        $this->staffUser->refresh();
        $this->assertNull($this->staffUser->avatar);
    }

    public function test_internal_user_cannot_update_email_role_or_status_via_profile_update(): void
    {
        $originalEmail = $this->staffUser->email;
        $originalStatus = $this->staffUser->status;

        $response = $this->actingAs($this->staffUser)->post('/profil', [
            'name'   => 'Budi Hacked',
            'email'  => 'hacked_staff@gtd.co.id',
            'role'   => 'super-admin',
            'status' => 'inactive',
        ]);

        $response->assertRedirect();

        $this->staffUser->refresh();
        $this->assertEquals('Budi Hacked', $this->staffUser->name);
        $this->assertEquals($originalEmail, $this->staffUser->email);
        $this->assertEquals($originalStatus, $this->staffUser->status);
        $this->assertTrue($this->staffUser->hasRole('staff'));
        $this->assertFalse($this->staffUser->hasRole('super-admin'));
    }

    public function test_internal_user_can_update_password_with_valid_current_password_and_strong_new_password(): void
    {
        $response = $this->actingAs($this->staffUser)->put('/profil/password', [
            'current_password'      => 'StaffSecret123!',
            'password'              => 'NewStrongStaff@2026',
            'password_confirmation' => 'NewStrongStaff@2026',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Password akun Anda berhasil diperbarui.');

        $this->staffUser->refresh();
        $this->assertTrue(Hash::check('NewStrongStaff@2026', $this->staffUser->password));
    }

    public function test_internal_user_cannot_update_password_with_incorrect_current_password(): void
    {
        $response = $this->actingAs($this->staffUser)->put('/profil/password', [
            'current_password'      => 'WrongCurrentPass!',
            'password'              => 'NewStrongStaff@2026',
            'password_confirmation' => 'NewStrongStaff@2026',
        ]);

        $response->assertSessionHasErrors('current_password');

        $this->staffUser->refresh();
        $this->assertTrue(Hash::check('StaffSecret123!', $this->staffUser->password));
    }

    public function test_internal_user_cannot_update_password_with_weak_password(): void
    {
        // 1. Too short
        $responseShort = $this->actingAs($this->staffUser)->put('/profil/password', [
            'current_password'      => 'StaffSecret123!',
            'password'              => 'Abc1!',
            'password_confirmation' => 'Abc1!',
        ]);
        $responseShort->assertSessionHasErrors('password');

        // 2. Missing numbers/symbols
        $responseWeak = $this->actingAs($this->staffUser)->put('/profil/password', [
            'current_password'      => 'StaffSecret123!',
            'password'              => 'passwordwithoutnumbers',
            'password_confirmation' => 'passwordwithoutnumbers',
        ]);
        $responseWeak->assertSessionHasErrors('password');

        // 3. Password confirmation mismatch
        $responseMismatch = $this->actingAs($this->staffUser)->put('/profil/password', [
            'current_password'      => 'StaffSecret123!',
            'password'              => 'StrongPass@123',
            'password_confirmation' => 'DifferentPass@123',
        ]);
        $responseMismatch->assertSessionHasErrors('password');
    }

    public function test_unauthenticated_user_cannot_access_internal_profile_routes(): void
    {
        $guestResponse = $this->get('/profil');
        $guestResponse->assertRedirect(route('login'));
    }

    public function test_customer_accessing_internal_profile_is_redirected_to_customer_profile(): void
    {
        $customerUser = User::create([
            'name'              => 'Customer User',
            'email'             => 'customer_' . uniqid() . '@maritime.com',
            'password'          => Hash::make('CustSecret123!'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $customerUser->assignRole('customer');

        $response = $this->actingAs($customerUser)->get('/profil');
        $response->assertRedirect(route('customer.profile.edit'));
    }
}
