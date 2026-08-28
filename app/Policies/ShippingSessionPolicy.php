<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;

use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Shipping Session Policy
 *
 * Defines authorization rules for ShippingSession operations.
 * Enforces customer data isolation.
 */
class ShippingSessionPolicy
{
    use HandlesAuthorization;

    /**
     * Grant super-admin all permissions automatically.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine if the user can view the shipping session.
     */
    public function view(User $user, ShippingSession $session): bool
    {
        if ($user->hasRole(UserRole::Customer->value) || $user->hasRole('customer')) {
            return $user->customer !== null && (string) $session->customer_id === (string) $user->customer->id;
        }

        return true; // role internal diatur lewat permission terpaisah
    }
}