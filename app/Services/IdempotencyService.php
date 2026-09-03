<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class IdempotencyService
{
    public function isEnabled(): bool
    {
        return (bool) config('idempotency.enabled', true);
    }

    public function getStoreName(): string
    {
        return (string) config('idempotency.store', 'redis');
    }

    public function getTtl(): int
    {
        return (int) config('idempotency.ttl', 604800);
    }

    public function getLockTimeout(): int
    {
        return (int) config('idempotency.lock_timeout', 15);
    }

    public function getLockWaitTimeout(): int
    {
        return (int) config('idempotency.lock_wait_timeout', 3);
    }

    public function isValidKeyFormat(?string $key): bool
    {
        if ($key === null || $key === '') {
            return false;
        }

        // UUIDv4: 8-4-4-4-12 hex characters
        // ULID: 26 Crockford base32 characters [0-7][0-9A-HJKMNP-TV-Z]{25} (case-insensitive)
        $uuidRegex = '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
        $ulidRegex = '/^[0-7][0-9a-hjkmnp-tv-z]{25}$/i';

        return (bool) (preg_match($uuidRegex, $key) || preg_match($ulidRegex, $key));
    }

    public function computeCanonicalScope(Request $request, string $rawKey): string
    {
        $userId = (string) ($request->user()?->id ?? 'guest');
        $method = strtoupper($request->method());
        $routeName = (string) ($request->route()?->getName() ?? $request->path());

        $routeParams = $request->route()?->parameters() ?? [];
        $normalizedParams = [];
        foreach ($routeParams as $pKey => $pValue) {
            $normalizedParams[$pKey] = is_object($pValue) && method_exists($pValue, 'getKey')
                ? (string) $pValue->getKey()
                : (string) $pValue;
        }
        ksort($normalizedParams, SORT_STRING);
        $paramsHash = hash('sha256', json_encode($normalizedParams));

        return "idempotency:v1:u:{$userId}:r:{$routeName}:p:{$paramsHash}:k:{$rawKey}";
    }

    public function computeLockKey(Request $request, string $rawKey): string
    {
        return "lock:" . $this->computeCanonicalScope($request, $rawKey);
    }

    public function computePayloadFingerprint(Request $request): string
    {
        // 1. Recursive key sorting of input parameters (excluding CSRF tokens)
        $inputs = $request->except(['_token']);
        $normalizedInputs = $this->recursiveKsort($inputs);

        // 2. Deterministic normalization of uploaded files
        $files = $request->allFiles();
        $normalizedFiles = [];
        ksort($files, SORT_STRING);
        foreach ($files as $name => $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                $normalizedFiles[$name] = [
                    'name'   => $file->getClientOriginalName(),
                    'mime'   => $file->getClientMimeType(),
                    'size'   => $file->getSize(),
                    'sha256' => hash_file('sha256', $file->getRealPath()),
                ];
            } elseif (is_array($file)) {
                $normalizedFiles[$name] = $this->normalizeFileArray($file);
            }
        }

        return hash('sha256', (string) json_encode([
            'inputs' => $normalizedInputs,
            'files'  => $normalizedFiles,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function recursiveKsort(mixed $data): mixed
    {
        if (!is_array($data)) {
            return $data;
        }

        // Only sort associative keys, preserve numeric array order
        $isAssoc = array_keys($data) !== range(0, count($data) - 1);
        if ($isAssoc) {
            ksort($data, SORT_STRING);
        }

        foreach ($data as $key => $value) {
            $data[$key] = $this->recursiveKsort($value);
        }

        return $data;
    }

    private function normalizeFileArray(array $files): array
    {
        ksort($files, SORT_STRING);
        $result = [];
        foreach ($files as $k => $f) {
            if ($f instanceof UploadedFile && $f->isValid()) {
                $result[$k] = [
                    'name'   => $f->getClientOriginalName(),
                    'mime'   => $f->getClientMimeType(),
                    'size'   => $f->getSize(),
                    'sha256' => hash_file('sha256', $f->getRealPath()),
                ];
            } elseif (is_array($f)) {
                $result[$k] = $this->normalizeFileArray($f);
            }
        }
        return $result;
    }

    public function lookup(string $cacheKey): ?array
    {
        try {
            return Cache::store($this->getStoreName())->get($cacheKey);
        } catch (\Throwable $e) {
            Log::warning("Idempotency lookup failed for key {$cacheKey}: " . $e->getMessage());
            return null;
        }
    }

    public function acquireLock(string $lockKey, int $ttl, int $wait): mixed
    {
        try {
            $lock = Cache::store($this->getStoreName())->lock($lockKey, $ttl);
            if ($wait > 0) {
                $acquired = $lock->block($wait);
                return $acquired ? $lock : false;
            }
            return $lock->acquire() ? $lock : false;
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            return false;
        } catch (\Throwable $e) {
            Log::warning("Idempotency lock acquisition failed for key {$lockKey}: " . $e->getMessage());
            return false;
        }
    }

    public function releaseLock(mixed $lock): void
    {
        if (is_object($lock) && method_exists($lock, 'release')) {
            try {
                $lock->release();
            } catch (\Throwable $e) {
                Log::warning("Idempotency lock release failed: " . $e->getMessage());
            }
        }
    }

    public function persistResult(string $cacheKey, array $data, int $ttl): void
    {
        Cache::store($this->getStoreName())->put($cacheKey, $data, $ttl);
    }
}
