<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTOs\UserDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * User Controller (API)
 *
 * Handles REST API endpoints for User management.
 * Used by the Flutter application.
 * Thin controller: all logic in UserService.
 */
class UserController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly UserService $userService,
    ) {}

    /**
     * GET /api/v1/users
     * List all users with optional search and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\User::class);

        $users = $this->userService->list(
            perPage: (int) $request->query('per_page', 15),
            search: $request->query('search'),
        );

        return $this->paginated(
            UserResource::collection($users),
        );
    }

    /**
     * POST /api/v1/users
     * Create a new user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create(
            UserDTO::from($request->validated())
        );

        return $this->created(new UserResource($user));
    }

    /**
     * GET /api/v1/users/{user}
     * Show a specific user.
     */
    public function show(string $user): JsonResponse
    {
        $this->authorize('view', \App\Models\User::findOrFail($user));

        $userData = $this->userService->findById($user);

        return $this->success(new UserResource($userData));
    }

    /**
     * PUT /api/v1/users/{user}
     * Update an existing user.
     */
    public function update(UpdateUserRequest $request, string $user): JsonResponse
    {
        $userData = $this->userService->update($user, UserDTO::from($request->validated()));

        return $this->success(new UserResource($userData), 'User updated successfully.');
    }

    /**
     * DELETE /api/v1/users/{user}
     * Delete a user.
     */
    public function destroy(Request $request, string $user): JsonResponse
    {
        $userModel = \App\Models\User::findOrFail($user);
        $this->authorize('delete', $userModel);

        $this->userService->delete($user, $request->user());

        return $this->noContent();
    }
}
