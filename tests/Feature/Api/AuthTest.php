<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Auth API Feature Tests
 *
 * Tests the full HTTP layer including routing, validation, service, and database.
 * Uses RefreshDatabase for clean state on each test.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    #[Test]
    public function user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'test@example.com',
            'password' => bcrypt('Password@1'),
            'status'   => UserStatus::Active->value,
        ]);
        $user->assignRole('field-worker');

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'test@example.com',
            'password' => 'Password@1',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'status', 'roles'],
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Login successful.',
                'data'    => [
                    'token_type' => 'Bearer',
                    'user'       => [
                        'id'    => $user->id,
                        'email' => 'test@example.com',
                        'roles' => ['field-worker'],
                    ],
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    #[Test]
    public function login_fails_with_invalid_credentials(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function login_fails_with_missing_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertUnprocessable()
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonValidationErrors(['email', 'password']);
    }

    #[Test]
    public function inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email'    => 'inactive@example.com',
            'password' => bcrypt('Password@1'),
            'status'   => UserStatus::Inactive->value,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'inactive@example.com',
            'password' => 'Password@1',
        ]);

        $response->assertUnprocessable()
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function user_can_get_their_profile(): void
    {
        $user = User::factory()->create([
            'status' => UserStatus::Active->value,
        ]);
        $user->assignRole('field-worker');

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'status',
                    'roles',
                ],
            ])
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonMissingPath('data.token')
            ->assertJsonMissingPath('data.password');
    }

    #[Test]
    public function user_can_logout_and_revoke_current_token(): void
    {
        $user = User::factory()->create();

        // Create actual PersonalAccessToken
        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/logout');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully.',
            ]);

        // Token must be revoked from personal_access_tokens table
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    #[Test]
    public function unauthenticated_user_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);

        $this->postJson('/api/v1/auth/logout')
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);

        $this->getJson('/api/v1/users')
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    #[Test]
    public function public_register_endpoint_does_not_exist(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'     => 'New User',
            'email'    => 'newuser@example.com',
            'password' => 'Password@1',
        ]);

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
            ]);
    }
}
