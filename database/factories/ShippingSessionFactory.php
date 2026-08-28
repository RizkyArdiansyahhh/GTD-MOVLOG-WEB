<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ShippingSessionStatus;
use App\Models\Customer;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShippingSession>
 */
class ShippingSessionFactory extends Factory
{
    protected $model = ShippingSession::class;

    public function definition(): array
    {
        return [
            'customer_id'    => Customer::factory(),
            'created_by'     => User::factory(),
            'assignment_no'  => 'LTR-' . fake()->unique()->numerify('#####'),
            'cargo_name'     => fake()->words(2, true),
            'total_quantity' => fake()->randomFloat(2, 10, 5000),
            'unit'           => 'MM',
            'origin'         => fake()->city(),
            'destination'    => fake()->city(),
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ];
    }
}