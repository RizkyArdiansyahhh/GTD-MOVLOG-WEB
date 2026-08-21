<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Global Search Controller
 *
 * Handles both the quick-search JSON endpoint for the navbar dropdown
 * and the dedicated full-page search results view.
 */
class GlobalSearchController extends Controller
{
    public function __construct(
        private readonly GlobalSearchService $searchService,
    ) {}

    /**
     * GET /global-search/quick
     * Real-time AJAX endpoint for navbar dropdown search.
     */
    public function quick(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $query = (string) $request->query('q', '');
        $data = $this->searchService->quickSearch($user, $query, 4);

        return response()->json($data);
    }

    /**
     * GET /search
     * Full-page search view with category filters and rich result cards.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = (string) ($request->query('q') ?? $request->query('search') ?? '');
        $category = $request->query('category');

        $searchData = $this->searchService->fullSearch($user, $query, $category, 30);

        return Inertia::render('Search/Index', [
            'searchData' => $searchData,
            'filters'    => [
                'q'        => $query,
                'category' => $category ?? 'all',
            ],
        ]);
    }
}