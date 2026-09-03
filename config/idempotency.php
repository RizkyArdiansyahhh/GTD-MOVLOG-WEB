<?php

declare(strict_types=1);

return [
    'enabled' => env('IDEMPOTENCY_ENABLED', true),
    'store' => env('IDEMPOTENCY_STORE', 'redis'),
    'ttl' => (int) env('IDEMPOTENCY_TTL', 604800), // 7 days in seconds
    'lock_timeout' => (int) env('IDEMPOTENCY_LOCK_TIMEOUT', 15), // 15 seconds mutex
    'lock_wait_timeout' => (int) env('IDEMPOTENCY_LOCK_WAIT_TIMEOUT', 3), // 3 seconds wait
    'header_name' => 'X-Idempotency-Key',
];
