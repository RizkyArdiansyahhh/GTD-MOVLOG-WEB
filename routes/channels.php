<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('customer.{customerId}', function (User $user, string $customerId) {
    return $user->hasRole('customer') && $user->customer?->id === $customerId;
});
