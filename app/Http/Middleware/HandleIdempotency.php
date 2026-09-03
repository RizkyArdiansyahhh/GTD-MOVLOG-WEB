<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\IdempotencyService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HandleIdempotency
{
    public function __construct(
        protected IdempotencyService $idempotencyService
    ) {}

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        if (!$this->idempotencyService->isEnabled()) {
            return $next($request);
        }

        $headerName = config('idempotency.header_name', 'X-Idempotency-Key');
        $rawKey = $request->header($headerName);

        // If no idempotency key is provided, execute as regular non-idempotent request
        if ($rawKey === null || trim($rawKey) === '') {
            return $next($request);
        }

        $rawKey = trim($rawKey);

        // 1. Validate key format (UUIDv4 or ULID)
        if (!$this->idempotencyService->isValidKeyFormat($rawKey)) {
            return response()->json([
                'success'    => false,
                'message'    => 'Format X-Idempotency-Key tidak valid. Gunakan format UUIDv4 atau ULID.',
                'error_code' => 'INVALID_IDEMPOTENCY_KEY',
            ], 422);
        }

        // 2. Compute canonical scope key, lock key, and payload fingerprint
        $cacheKey = $this->idempotencyService->computeCanonicalScope($request, $rawKey);
        $lockKey = $this->idempotencyService->computeLockKey($request, $rawKey);
        $currentFingerprint = $this->idempotencyService->computePayloadFingerprint($request);

        // 3. FIRST CACHE LOOKUP
        $cached = $this->idempotencyService->lookup($cacheKey);
        if ($cached !== null) {
            return $this->buildReplayResponse($cached, $currentFingerprint);
        }

        // 4. ACQUIRE ATOMIC MUTEX LOCK
        $ttl = $this->idempotencyService->getLockTimeout();
        $wait = $this->idempotencyService->getLockWaitTimeout();
        $lock = $this->idempotencyService->acquireLock($lockKey, $ttl, $wait);

        if ($lock === false || $lock === null) {
            return response()->json([
                'success'    => false,
                'message'    => 'Permintaan dengan kunci idempotensi ini sedang diproses. Silakan coba sesaat lagi.',
                'error_code' => 'CONCURRENT_REQUEST',
            ], 409, ['Retry-After' => '2']);
        }

        try {
            // 5. SECOND CACHE LOOKUP (Mandatory Post-Lock Check)
            $cachedAfterLock = $this->idempotencyService->lookup($cacheKey);
            if ($cachedAfterLock !== null) {
                return $this->buildReplayResponse($cachedAfterLock, $currentFingerprint);
            }

            // 6. EXECUTE CONTROLLER & DB TRANSACTION
            $response = $next($request);

            // 7. CHECK STATUS & PERSIST RESULT
            $statusCode = $response->getStatusCode();
            if ($statusCode >= 200 && $statusCode < 300) {
                $responseBody = $this->extractResponseBody($response);
                $persistData = [
                    'fingerprint' => $currentFingerprint,
                    'status'      => $statusCode,
                    'body'        => $responseBody,
                    'headers'     => [
                        'Content-Type' => $response->headers->get('Content-Type', 'application/json'),
                    ],
                ];

                try {
                    $this->idempotencyService->persistResult(
                        $cacheKey,
                        $persistData,
                        $this->idempotencyService->getTtl()
                    );
                } catch (\Throwable $e) {
                    Log::warning("Gagal menyimpan hasil idempotensi ke Redis untuk key {$cacheKey}: " . $e->getMessage());
                }
            }

            return $response;
        } finally {
            $this->idempotencyService->releaseLock($lock);
        }
    }

    protected function buildReplayResponse(array $cached, string $currentFingerprint): JsonResponse
    {
        $cachedFingerprint = $cached['fingerprint'] ?? '';
        if (!hash_equals($cachedFingerprint, $currentFingerprint)) {
            return response()->json([
                'success'    => false,
                'message'    => 'Kunci idempotensi telah digunakan sebelumnya dengan parameter atau data yang berbeda.',
                'error_code' => 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
            ], 409);
        }

        $body = $cached['body'] ?? [];
        $status = $cached['status'] ?? 200;
        $headers = array_merge($cached['headers'] ?? [], ['X-Cache' => 'HIT-IDEMPOTENT']);

        return response()->json($body, $status, $headers);
    }

    protected function extractResponseBody(SymfonyResponse $response): mixed
    {
        if ($response instanceof JsonResponse) {
            return $response->getData(true);
        }

        $content = $response->getContent();
        $decoded = json_decode((string) $content, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $content;
    }
}
