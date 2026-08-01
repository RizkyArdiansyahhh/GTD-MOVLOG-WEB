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
    public function show(string $user): Response
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
    public function edit(string $user): Response
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
    public function update(UpdateUserRequest $request, string $user): RedirectResponse
    {
        $this->userService->update($user, UserDTO::from($request->validated()));

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * DELETE /users/{user}
     * Delete a user.
     */
    public function destroy(string $user)
    {
        $request = request();
        $userModel = \App\Models\User::find($user);

        if (!$userModel) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengguna tidak ditemukan.',
                ], 404);
            }
            return redirect()->back()->withErrors(['error' => 'Pengguna tidak ditemukan.']);
        }

        if ($request->user() && $request->user()->cannot('delete', $userModel)) {
            $msg = 'Anda tidak memiliki akses untuk menghapus pengguna ini.';
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json(['success' => false, 'message' => $msg], 403);
            }
            return redirect()->back()->withErrors(['error' => $msg]);
        }

        try {
            $this->userService->delete($user, $request->user());
        } catch (\App\Exceptions\BusinessException $e) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengguna tidak ditemukan.',
                ], 404);
            }
            return redirect()->back()->withErrors(['error' => 'Pengguna tidak ditemukan.']);
        } catch (\Throwable $e) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Gagal menghapus pengguna.',
                ], 500);
            }
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }

        if ($request->expectsJson() && !$request->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'message' => 'Pengguna berhasil dihapus.',
            ]);
        }

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }
}
