<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Customer;

/**
 * Customer Service
 *
 * Owns customer creation so controllers stay thin.
 */
class CustomerService
{
    public function create(array $validated): Customer
    {
        return Customer::create($validated);
    }
}
