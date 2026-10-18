<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Http\Controllers\Web\Auth\PasswordResetController;
use App\Models\Customer;
use App\Models\User;
use App\Notifications\ResetPasswordRequested;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use DatabaseTransactions;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'customer']);

        $uniq = uniqid('pwdreset_');

        $customer = Customer::create([
            'company_name' => 'PT Reset '.$uniq,
            'pic_name' => 'Bpk. Reset',
            'email' => "reset_{$uniq}@cargo.com",
            'phone' => '081234567890',
        ]);

        $this->user = User::create([
            'customer_id' => $customer->id,
            'name' => 'Reset User',
            'email' => "reset_{$uniq}@cargo.com",
            'password' => 'OldPass@123',
            'status' => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->user->assignRole('customer');
    }

    public function test_guest_can_view_forgot_password_page(): void
    {
        $this->get('/forgot-password')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/ForgotPassword', false));
    }

    public function test_reset_link_sent_for_registered_email(): void
    {
        Notification::fake();

        $this->post('/forgot-password', ['email' => $this->user->email])
            ->assertRedirect()
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);

        Notification::assertSentTo($this->user, ResetPasswordRequested::class);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $this->user->email]);
    }

    public function test_reset_link_contains_valid_token(): void
    {
        Notification::fake();

        $this->post('/forgot-password', ['email' => $this->user->email]);

        Notification::assertSentTo(
            $this->user,
            ResetPasswordRequested::class,
            function (ResetPasswordRequested $n) {
                $mail = $n->toMail($this->user);

                return str_contains($n->resetUrl, '/reset-password/')
                    && str_contains($n->resetUrl, urlencode($this->user->email))
                    && $mail->subject === 'Reset Your GTD-MoveLog Password'
                    && $mail->actionUrl === $n->resetUrl;
            }
        );
    }

    public function test_reset_link_uses_app_url_instead_of_request_host(): void
    {
        config(['app.url' => 'https://accounts.example.test/portal/']);
        Notification::fake();

        $this->post('http://unexpected.local/forgot-password', ['email' => $this->user->email])
            ->assertRedirect();

        Notification::assertSentTo($this->user, ResetPasswordRequested::class,
            fn (ResetPasswordRequested $notification) => str_starts_with(
                $notification->resetUrl, 'https://accounts.example.test/portal/reset-password/'
            ) && str_contains($notification->resetUrl, urlencode($this->user->email))
        );
    }

    public function test_reset_request_logs_email_status_and_ip(): void
    {
        Notification::fake();
        Log::spy();

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
            ->post('/forgot-password', ['email' => $this->user->email])
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);

        Log::shouldHaveReceived('info')->with('password.reset.link_requested', [
            'email' => $this->user->email,
            'status' => Password::RESET_LINK_SENT,
            'ip' => '192.0.2.10',
        ])->once();
    }

    public function test_mail_failure_is_logged_and_returns_generic_response(): void
    {
        Log::spy();
        Password::shouldReceive('sendResetLink')->once()->with(['email' => $this->user->email])
            ->andThrow(new \RuntimeException('SMTP unavailable'));

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
            ->post('/forgot-password', ['email' => $this->user->email])
            ->assertRedirect()
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);

        Log::shouldHaveReceived('error')->with('password.reset.mail_failed', [
            'email' => $this->user->email,
            'ip' => '192.0.2.10',
            'exception' => \RuntimeException::class,
            'message' => 'SMTP unavailable',
        ])->once();
    }

    public function test_unregistered_email_returns_same_generic_response(): void
    {
        Notification::fake();

        $this->post('/forgot-password', ['email' => 'ghost@nowhere.com'])
            ->assertRedirect()
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);

        Notification::assertNothingSent();
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'ghost@nowhere.com']);
    }

    public function test_registered_and_unregistered_return_identical_response(): void
    {
        Notification::fake();

        $this->post('/forgot-password', ['email' => $this->user->email])
            ->assertRedirect()
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);
        $registeredMessage = session('success');

        $this->post('/forgot-password', ['email' => 'ghost@nowhere.com'])
            ->assertRedirect()
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);
        $unregisteredMessage = session('success');

        $this->assertSame($registeredMessage, $unregisteredMessage);
        $this->assertSame(PasswordResetController::GENERIC_SUCCESS, $registeredMessage);
    }

    public function test_throttled_broker_still_returns_generic_response(): void
    {
        Notification::fake();
        Log::spy();

        DB::table('password_reset_tokens')->insert([
            'email' => $this->user->email,
            'token' => Hash::make('recent-token'),
            'created_at' => now(),
        ]);

        $this->post('/forgot-password', ['email' => $this->user->email])
            ->assertRedirect()
            ->assertSessionHas('success', PasswordResetController::GENERIC_SUCCESS);

        Notification::assertNothingSent();
        Log::shouldHaveReceived('warning')->with('password.reset.link_not_sent', [
            'email' => $this->user->email,
            'status' => Password::RESET_THROTTLED,
            'ip' => '127.0.0.1',
        ])->once();
    }

    public function test_reset_page_renders_with_token_and_email_only(): void
    {
        $this->get('/reset-password/abc-token-123?email='.urlencode($this->user->email))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/ResetPassword', false)
                ->where('token', 'abc-token-123')
                ->where('email', $this->user->email)
                ->missing('user')
                ->missing('role'));
    }

    public function test_invalid_token_is_rejected(): void
    {
        $this->post('/reset-password', [
            'token' => 'totally-wrong-token',
            'email' => $this->user->email,
            'password' => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ])->assertSessionHasErrors('email');
    }

    public function test_expired_token_is_rejected(): void
    {
        DB::table('password_reset_tokens')->insert([
            'email' => $this->user->email,
            'token' => Hash::make('expired-token'),
            'created_at' => now()->subHours(2),
        ]);

        $this->post('/reset-password', [
            'token' => 'expired-token',
            'email' => $this->user->email,
            'password' => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ])->assertSessionHasErrors('email');
    }

    public function test_token_cannot_be_reused(): void
    {
        $token = Password::createToken($this->user);

        $payload = [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ];

        $this->post('/reset-password', $payload)->assertRedirect('/login');
        $this->post('/reset-password', $payload)->assertSessionHasErrors('email');
    }

    public function test_password_confirmation_is_required(): void
    {
        $token = Password::createToken($this->user);

        $this->post('/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewPass@123',
        ])->assertSessionHasErrors('password');
    }

    public function test_weak_password_is_rejected(): void
    {
        $token = Password::createToken($this->user);

        // No uppercase, no symbol.
        $this->post('/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors('password');
    }

    public function test_old_password_stops_working_and_new_password_works(): void
    {
        $token = Password::createToken($this->user);

        $this->post('/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ])->assertRedirect('/login');

        // Old password rejected.
        $this->post('/login', [
            'email' => $this->user->email,
            'password' => 'OldPass@123',
        ])->assertSessionHasErrors('email');

        // New password accepted (redirects to intended dashboard).
        $this->post('/login', [
            'email' => $this->user->email,
            'password' => 'NewPass@123',
        ])->assertRedirect();
        $this->assertAuthenticatedAs($this->user);
    }

    public function test_successful_reset_invalidates_other_sessions(): void
    {
        // Existing session on "another device" — AuthenticateSession
        // stores the current password hash in the session here.
        $this->actingAs($this->user)->get('/customer/dashboard')->assertOk();

        // Password changed elsewhere (the broker reset flow itself is
        // covered by the tests above; same end state).
        $this->user->forceFill(['password' => 'NewPass@123'])->save();

        // Old session is now logged out by AuthenticateSession.
        $this->get('/customer/dashboard')->assertRedirect('/login');
    }

    public function test_forgot_password_is_throttled(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/forgot-password', ['email' => $this->user->email]);
        }

        $this->post('/forgot-password', ['email' => $this->user->email])
            ->assertStatus(429);
    }

    public function test_authenticated_user_cannot_use_reset_flow_for_other_accounts(): void
    {
        // Guest-only pages redirect logged-in users away.
        $this->actingAs($this->user)->get('/forgot-password')->assertRedirect();
        $this->actingAs($this->user)->get('/reset-password/some-token')->assertRedirect();
        $this->actingAs($this->user)->post('/forgot-password', ['email' => $this->user->email])->assertRedirect();
    }
}
