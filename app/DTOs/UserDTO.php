<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * User Data Transfer Object
 *
 * Used to transfer user data between Controller → Service → Repository layers.
 * Built on Spatie Laravel Data for type-safety and built-in validation.
 */
class UserDTO extends Data
{
    public function __construct(
        #[Max(255)]
        public readonly string $name,

        #[Email, Max(255)]
        public readonly string $email,

        #[Min(8), Max(255)]
        public readonly string|null|Optional $password = null,

        public readonly UserStatus $status,

        public readonly string|null $role = null,
    ) {}
}
