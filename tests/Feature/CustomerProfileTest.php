<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerProfileTest extends TestCase
{
    use DatabaseTransactions;

    private User $customerUser;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'customer']);
        Role::firstOrCreate(['name' => 'staff']);

        $uniq = uniqid();

        $this->customer = Customer::create([
            'company_name' => 'PT Pelayaran Nusantara ' . $uniq,
            'pic_name'     => 'Bpk. Ahmad Dahlan',
            'email'        => "nusantara_{$uniq}@maritime.com",
            'phone'        => '081122334455',
        ]);

        $this->customerUser = User::create([
            'customer_id'       => $this->customer->id,
            'name'              => 'Ahmad Dahlan',
            'email'             => "ahmad_{$uniq}@maritime.com",
            'phone'             => '081122334455',
            'password'          => Hash::make('Secret123!'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->customerUser->assignRole('customer');
    }

    public function test_customer_can_view_profile_edit_page(): void
    {
        $response = $this->actingAs($this->customerUser)->get('/customer/profil');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/EditProfile', false)
                ->has('profile', fn (Assert $p) => $p
                    ->where('id', (string) $this->customerUser->id)
                    ->where('name', 'Ahmad Dahlan')
                    ->where('email', $this->customerUser->email)
                    ->where('phone', '081122334455')
                    ->has('customer', fn (Assert $c) => $c
                        ->where('id', (string) $this->customer->id)
                        ->where('company_name', $this->customer->company_name)
                        ->etc()
                    )
                    ->etc()
                )
            );
    }

    public function test_customer_can_update_profile_name_and_phone(): void
    {
        $response = $this->actingAs($this->customerUser)->post('/customer/profil', [
            'name'  => 'Ahmad Dahlan S.T.',
            'phone' => '081987654321',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Profil Anda berhasil diperbarui.');

        $this->customerUser->refresh();
        $this->assertEquals('Ahmad Dahlan S.T.', $this->customerUser->name);
        $this->assertEquals('081987654321', $this->customerUser->phone);
    }

    public function test_customer_can_upload_and_delete_avatar(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        // 1. Upload new avatar
        $response = $this->actingAs($this->customerUser)->post('/customer/profil', [
            'name'   => 'Ahmad Dahlan',
            'phone'  => '081122334455',
            'avatar' => $file,
        ]);

        $response->assertRedirect();
        $this->customerUser->refresh();
        $this->assertNotNull($this->customerUser->avatar);
        Storage::disk('public')->assertExists($this->customerUser->avatar);

        // 2. Delete avatar
        $deleteResponse = $this->actingAs($this->customerUser)->post('/customer/profil', [
            'name'          => 'Ahmad Dahlan',
            'phone'         => '081122334455',
            'delete_avatar' => true,
        ]);

        $deleteResponse->assertRedirect();
        $this->customerUser->refresh();
        $this->assertNull($this->customerUser->avatar);
    }

    public function test_customer_cannot_update_customer_id_or_email_via_profile_update(): void
    {
        $otherCustomer = Customer::create([
            'company_name' => 'PT Kompetitor Lain',
            'email'        => 'kompetitor@other.com',
        ]);

        $originalEmail = $this->customerUser->email;
        $originalCustomerId = $this->customerUser->customer_id;

        $response = $this->actingAs($this->customerUser)->post('/customer/profil', [
            'name'        => 'Ahmad Updated',
            'customer_id' => $otherCustomer->id,
            'email'       => 'hacked_email@other.com',
        ]);

        $response->assertRedirect();

        $this->customerUser->refresh();
        $this->assertEquals('Ahmad Updated', $this->customerUser->name);
        $this->assertEquals($originalEmail, $this->customerUser->email);
        $this->assertEquals($originalCustomerId, $this->customerUser->customer_id);
    }

    public function test_customer_can_update_password_with_valid_current_password_and_strong_new_password(): void
    {
        $response = $this->actingAs($this->customerUser)->put('/customer/profil/password', [
            'current_password'      => 'Secret123!',
            'password'              => 'NewStrongPass@2026',
            'password_confirmation' => 'NewStrongPass@2026',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Password akun Anda berhasil diperbarui.');

        $this->customerUser->refresh();
        $this->assertTrue(Hash::check('NewStrongPass@2026', $this->customerUser->password));
    }

    public function test_customer_cannot_update_password_with_incorrect_current_password(): void
    {
        $response = $this->actingAs($this->customerUser)->put('/customer/profil/password', [
            'current_password'      => 'WrongCurrentPassword!',
            'password'              => 'NewStrongPass@2026',
            'password_confirmation' => 'NewStrongPass@2026',
        ]);

        $response->assertSessionHasErrors('current_password');

        $this->customerUser->refresh();
        $this->assertTrue(Hash::check('Secret123!', $this->customerUser->password));
    }

    public function test_customer_cannot_update_password_with_weak_password(): void
    {
        // 1. Too short
        $responseShort = $this->actingAs($this->customerUser)->put('/customer/profil/password', [
            'current_password'      => 'Secret123!',
            'password'              => 'Short1!',
            'password_confirmation' => 'Short1!',
        ]);
        $responseShort->assertSessionHasErrors('password');

        // 2. Missing numbers/symbols
        $responseWeak = $this->actingAs($this->customerUser)->put('/customer/profil/password', [
            'current_password'      => 'Secret123!',
            'password'              => 'alllowercaseonly',
            'password_confirmation' => 'alllowercaseonly',
        ]);
        $responseWeak->assertSessionHasErrors('password');

        // 3. Password confirmation mismatch
        $responseMismatch = $this->actingAs($this->customerUser)->put('/customer/profil/password', [
            'current_password'      => 'Secret123!',
            'password'              => 'StrongPass@123',
            'password_confirmation' => 'DifferentPass@123',
        ]);
        $responseMismatch->assertSessionHasErrors('password');
    }

    public function test_unauthenticated_or_non_customer_cannot_access_profile_routes(): void
    {
        // 1. Guest redirected to login
        $guestResponse = $this->get('/customer/profil');
        $guestResponse->assertRedirect(route('login'));

        // 2. Staff user forbidden by role:customer middleware
        $staffUser = User::create([
            'name'              => 'Staff Operasional',
            'email'             => 'staff_' . uniqid() . '@gtd.co.id',
            'password'          => Hash::make('password'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $staffUser->assignRole('staff');

        $staffResponse = $this->actingAs($staffUser)->get('/customer/profil');
        $staffResponse->assertForbidden();
    }
}
