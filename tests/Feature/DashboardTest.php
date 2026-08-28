<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\User;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class DashboardTest extends TestCase
{
    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_dashboard_with_operational_props(): void
    {
        $user = User::factory()->create([
            'status' => UserStatus::Active,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->get('/');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Index', false)
                ->has('stats')
                ->has('recentSessions')
                ->has('masterCheckpoints')
            );
    }
}