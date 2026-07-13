<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\DTOs\UserDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * User Controller (Web / Inertia)
 *
 * Handles Inertia.js responses for the Admin Dashboard user management.
 * Thin controller: all business logic in UserService.
 */
class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    /**
     * GET /users
     * Display the user listing page.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', \App\Models\User::class);

        $users = $this->userService->list(
            perPage: (int) request()->query('per_page', 15),
            search: request()->query('search'),
        );

        return Inertia::render('Users/Index', [
            'users'   => $users,
            'filters' => request()->only(['search', 'per_page']),
        ]);
    }

    /**
     * GET /users/create
     * Show the create user form.
     */
    public function create(): Response
    {
        $this->authorize('create', \App\Models\User::class);

        return Inertia::render('Users/Create');
    }

    /**
     * POST /users
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->create(UserDTO::from($request->validated()));

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * GET /users/{user}
     * Show a user's profile.
     */
    public function show(int $user): Response
    {
        $userData = $this->userService->findById($user);

        $this->authorize('view', $userData);

        return Inertia::render('Users/Show', [
            'user' => $userData,
        ]);
    }

    /**
     * GET /users/{user}/edit
     * Show the edit form for a user.
     */
    public function edit(int $user): Response
    {
        $userData = $this->userService->findById($user);

        $this->authorize('update', $userData);

        return Inertia::render('Users/Edit', [
            'user' => $userData,
        ]);
    }

    /**
     * PUT /users/{user}
     * Update an existing user.
     */
    public function update(UpdateUserRequest $request, int $user): RedirectResponse
    {
        $this->userService->update($user, UserDTO::from($request->validated()));

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * DELETE /users/{user}
     * Delete a user.
     */
    public function destroy(int $user): RedirectResponse
    {
        $this->authorize('delete', \App\Models\User::findOrFail($user));

        $this->userService->delete($user);

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }
}
