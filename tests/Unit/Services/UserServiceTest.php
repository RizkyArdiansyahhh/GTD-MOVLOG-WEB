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
            ->with(15, ['*'], ['roles'], [])
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
    public function it_throws_business_exception_when_deleting_last_super_admin(): void
    {
        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Cannot delete the last super-admin user.');

        $user = Mockery::mock(User::class);
        $user->shouldReceive('hasRole')->with('super-admin')->andReturn(true);

        $this->repository
            ->shouldReceive('findOrFail')
            ->with(1, ['*'], ['roles', 'permissions'])
            ->andReturn($user);

        $this->repository
            ->shouldReceive('count')
            ->andReturn(1);

        $this->service->delete(1);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
