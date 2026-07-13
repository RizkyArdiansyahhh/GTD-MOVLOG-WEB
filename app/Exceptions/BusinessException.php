<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

/**
 * Business Exception
 *
 * Thrown when a business rule is violated within a Service.
 * The Handler will format this as a 422 JSON response on API routes.
 */
class BusinessException extends Exception
{
    public function __construct(
        string $message = 'A business rule was violated.',
        int $code = 422,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}
