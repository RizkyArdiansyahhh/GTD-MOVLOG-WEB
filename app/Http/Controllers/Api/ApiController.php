<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;

/**
 * Base API Controller
 *
 * All API controllers inherit from this base class to ensure standardized
 * JSON response envelopes and shared API transport capabilities.
 */
abstract class ApiController extends Controller
{
    use ApiResponseTrait;
}
