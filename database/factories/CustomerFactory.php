<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'company_name' => fake()->company(),
            'address'      => fake()->address(),
            'phone'        => fake()->phoneNumber(),
            'email'        => fake()->unique()->companyEmail(),
            'pic_name'     => fake()->name(),
        ];
    }
}