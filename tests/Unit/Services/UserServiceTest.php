<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\DTOs\UserDTO;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BusinessException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\UserService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Mockery;
use Mockery\MockInterface;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * User Service Unit Tests
 *
 * Tests business logic in UserService using mocked dependencies.
 * No database interaction — pure unit tests.
 */
class UserServiceTest extends TestCase
{
    private UserService $service;

    /** @var MockInterface&UserRepositoryInterface */
    private MockInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = Mockery::mock(UserRepositoryInterface::class);
        $this->service    = new UserService($this->repository);
    }

    #[Test]
    public function it_returns_paginated_users_without_search(): void
    {
        $paginator = Mockery::mock(LengthAwarePaginator::class);

        $this->repository
            ->shouldReceive('paginate')
            ->once()
            ->andReturn($paginator);

        $result = $this->service->list(15, null);

        $this->assertSame($paginator, $result);
    }

    #[Test]
    public function it_calls_search_when_keyword_is_provided(): void
    {
        $paginator = Mockery::mock(LengthAwarePaginator::class);

        $this->repository
            ->shouldReceive('search')
            ->once()
            ->with('john', 15)
            ->andReturn($paginator);

        $result = $this->service->list(15, 'john');

        $this->assertSame($paginator, $result);
    }

    #[Test]
    public function it_finds_user_by_id(): void
    {
        $user = Mockery::mock(User::class);

        $this->repository
            ->shouldReceive('findOrFail')
            ->once()
            ->with(1, ['*'], ['roles', 'permissions'])
            ->andReturn($user);

        $result = $this->service->findById(1);

        $this->assertSame($user, $result);
    }

    #[Test]
    public function it_throws_business_exception_when_deleting_self(): void
    {
        $this->expectException(BusinessException::class);

        // Use real (partially filled) User objects so property access works naturally
        $currentUser = new User(['id' => 'same-id']);
        $user        = new User(['id' => 'same-id']);

        $this->repository
            ->shouldReceive('find')
            ->once()
            ->andReturn($user);

        $this->service->delete('same-id', $currentUser);
    }

    #[Test]
    public function it_sets_customer_id_when_updating_user_with_customer_role(): void
    {
        $customerId = 'cust-uuid-123';
        $userId     = 'user-uuid-456';

        $dto = new UserDTO(
            name: 'Test Customer',
            email: 'customer@test.com',
            password: null,
            status: UserStatus::Active,
            role: UserRole::Customer->value,
            customer_id: $customerId,
            company_id: null,
            phone: null,
        );

        $user = Mockery::mock(User::class);
        $user->shouldReceive('syncRoles')->once()->with([UserRole::Customer->value]);
        $user->shouldReceive('load')->once()->with('roles')->andReturnSelf();

        // Capture what data is passed to repository update
        $capturedData = null;
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->andReturnUsing(function ($id, $data) use (&$capturedData, $user) {
                $capturedData = $data;
                return $user;
            });

        // Fake DB so transaction executes the closure without a real connection
        DB::shouldReceive('transaction')
            ->once()
            ->andReturnUsing(fn ($callback) => $callback());

        $result = $this->service->update($userId, $dto);

        $this->assertSame($user, $result);
        $this->assertArrayHasKey('customer_id', $capturedData);
        $this->assertSame($customerId, $capturedData['customer_id']);
    }

    #[Test]
    public function it_resolves_customer_id_from_company_id_when_updating_customer_user(): void
    {
        $companyId = 'company-uuid-789';
        $userId    = 'user-uuid-456';

        $dto = new UserDTO(
            name: 'Test Customer',
            email: 'customer@test.com',
            password: null,
            status: UserStatus::Active,
            role: UserRole::Customer->value,
            customer_id: null,     // customer_id is empty
            company_id: $companyId, // but company_id is provided
            phone: null,
        );

        $user = Mockery::mock(User::class);
        $user->shouldReceive('syncRoles')->once()->with([UserRole::Customer->value]);
        $user->shouldReceive('load')->once()->with('roles')->andReturnSelf();

        $capturedData = null;
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->andReturnUsing(function ($id, $data) use (&$capturedData, $user) {
                $capturedData = $data;
                return $user;
            });

        DB::shouldReceive('transaction')
            ->once()
            ->andReturnUsing(fn ($callback) => $callback());

        $this->service->update($userId, $dto);

        // Should resolve company_id into customer_id
        $this->assertArrayHasKey('customer_id', $capturedData);
        $this->assertSame($companyId, $capturedData['customer_id']);
    }

    #[Test]
    public function it_clears_customer_id_when_role_changes_from_customer_to_non_customer(): void
    {
        $userId = 'user-uuid-456';

        $dto = new UserDTO(
            name: 'Former Customer',
            email: 'former@test.com',
            password: null,
            status: UserStatus::Active,
            role: 'staff', // changed to staff
            customer_id: null,
            company_id: null,
            phone: null,
        );

        $user = Mockery::mock(User::class);
        $user->shouldReceive('syncRoles')->once()->with(['staff']);
        $user->shouldReceive('load')->once()->with('roles')->andReturnSelf();

        $capturedData = null;
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->andReturnUsing(function ($id, $data) use (&$capturedData, $user) {
                $capturedData = $data;
                return $user;
            });

        DB::shouldReceive('transaction')
            ->once()
            ->andReturnUsing(fn ($callback) => $callback());

        $this->service->update($userId, $dto);

        // customer_id must be explicitly null when role is not customer
        $this->assertArrayHasKey('customer_id', $capturedData);
        $this->assertNull($capturedData['customer_id']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
