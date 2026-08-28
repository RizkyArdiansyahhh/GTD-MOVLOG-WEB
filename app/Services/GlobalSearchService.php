<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DocumentStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Document;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Global Search Service
 *
 * Provides central, multi-category search with strict database-level authorization.
 */
class GlobalSearchService
{
    /**
     * Perform quick search for navbar dropdown (grouped by category with item limit).
     *
     * @return array{
     *     query: string,
     *     categories: array<string, array{label: string, count: int, items: array}>,
     *     total_count: int
     * }
     */
    public function quickSearch(User $user, string $query, int $limitPerCategory = 4): array
    {
        $keyword = trim($query);
        if ($keyword === '') {
            return [
                'query'       => '',
                'categories'  => [],
                'total_count' => 0,
            ];
        }

        $categories = [
            'barang'     => ['label' => 'Barang / Tracking', 'items' => []],
            'sesi'       => ['label' => 'Sesi Pekerja', 'items' => []],
            'dokumen'    => ['label' => 'Dokumen', 'items' => []],
            'checkpoint' => ['label' => 'Checkpoint', 'items' => []],
            'users'      => ['label' => 'Pengguna', 'items' => []],
        ];

        $totalCount = 0;

        foreach ($categories as $catKey => $meta) {
            $results = $this->searchByCategory($user, $keyword, $catKey, $limitPerCategory);
            $count = count($results);
            if ($count > 0) {
                $categories[$catKey]['items'] = $results;
                $categories[$catKey]['count'] = $count;
                $totalCount += $count;
            } else {
                unset($categories[$catKey]);
            }
        }

        return [
            'query'       => $keyword,
            'categories'  => $categories,
            'total_count' => $totalCount,
        ];
    }

    /**
     * Perform full search across all or a specific category.
     *
     * @return array{
     *     query: string,
     *     active_category: ?string,
     *     categories: array<string, array{label: string, count: int}>,
     *     results: array,
     *     total_count: int
     * }
     */
    public function fullSearch(User $user, string $query, ?string $selectedCategory = null, int $limit = 20): array
    {
        $keyword = trim($query);
        $allCategories = [
            'barang'     => 'Barang / Tracking',
            'sesi'       => 'Sesi Pekerja',
            'dokumen'    => 'Dokumen',
            'checkpoint' => 'Checkpoint',
            'users'      => 'Pengguna',
        ];

        if ($keyword === '') {
            return [
                'query'           => '',
                'active_category' => $selectedCategory,
                'categories'      => [],
                'results'         => [],
                'total_count'     => 0,
            ];
        }

        $categoryCounts = [];
        $collectedResults = [];
        $totalCount = 0;

        foreach ($allCategories as $catKey => $catLabel) {
            // Check if user is allowed to access this category at all
            if (!$this->canAccessCategory($user, $catKey)) {
                continue;
            }

            $catResults = $this->searchByCategory($user, $keyword, $catKey, 50);
            $catCount = count($catResults);
            $categoryCounts[$catKey] = [
                'label' => $catLabel,
                'count' => $catCount,
            ];

            if ($selectedCategory === null || $selectedCategory === '' || $selectedCategory === 'all') {
                $collectedResults = array_merge($collectedResults, array_slice($catResults, 0, $limit));
            } elseif ($selectedCategory === $catKey) {
                $collectedResults = array_slice($catResults, 0, $limit);
            }

            $totalCount += $catCount;
        }

        return [
            'query'           => $keyword,
            'active_category' => $selectedCategory ?: 'all',
            'category_counts' => $categoryCounts,
            'results'         => $collectedResults,
            'total_count'     => $totalCount,
        ];
    }

    /**
     * Search within a single category with role-based scoping.
     */
    public function searchByCategory(User $user, string $keyword, string $category, int $limit = 10): array
    {
        if (!$this->canAccessCategory($user, $category)) {
            return [];
        }

        return match ($category) {
            'barang'     => $this->searchBarang($user, $keyword, $limit),
            'sesi'       => $this->searchSesiPekerja($user, $keyword, $limit),
            'dokumen'    => $this->searchDokumen($user, $keyword, $limit),
            'checkpoint' => $this->searchCheckpoint($user, $keyword, $limit),
            'users'      => $this->searchUsers($user, $keyword, $limit),
            default      => [],
        };
    }

    /**
     * Check if user can access a specific category.
     */
    private function canAccessCategory(User $user, string $category): bool
    {
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value);
        $isSupervisor = $user->hasRole(UserRole::Supervisor->value);
        $isStaff = $user->hasRole(UserRole::Staff->value);
        $isFieldWorker = $user->hasRole(UserRole::FieldWorker->value);
        $isCustomer = $user->hasRole(UserRole::Customer->value);

        return match ($category) {
            'users'      => $isSuperAdmin || $isSupervisor,
            'sesi'       => $isSuperAdmin || $isSupervisor || $isStaff || $isFieldWorker,
            'barang'     => true,
            'dokumen'    => true,
            'checkpoint' => true,
            default      => false,
        };
    }

    /**
     * Resolve Customer record for a Customer user.
     */
    private function getCustomerForUser(User $user): ?Customer
    {
        return $user->customer;
    }

    /**
     * 1. Search Barang / Tracking (ShippingSession)
     */
    private function searchBarang(User $user, string $keyword, int $limit): array
    {
        $lower = '%' . strtolower($keyword) . '%';
        $query = ShippingSession::with(['customer', 'currentCheckpoint']);

        // -- Role Authorization Scoping --
        if ($user->hasRole(UserRole::Customer->value)) {
            $customer = $this->getCustomerForUser($user);
            if (!$customer) return [];
            $query->where('customer_id', $customer->id);
        } elseif ($user->hasRole(UserRole::FieldWorker->value)) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('sessionCheckpoints', function ($sq) use ($user) {
                      $sq->where('pic_user_id', $user->id);
                  });
            });
        }

        // -- Search Filters --
        $query->where(function ($q) use ($lower) {
            $q->whereRaw('LOWER(assignment_no) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(cargo_name) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(origin) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(destination) LIKE ?', [$lower])
              ->orWhereHas('customer', function ($cq) use ($lower) {
                  $cq->whereRaw('LOWER(company_name) LIKE ?', [$lower]);
              })
              ->orWhereHas('currentCheckpoint', function ($cpq) use ($lower) {
                  $cpq->whereRaw('LOWER(name) LIKE ?', [$lower]);
              });
        });

        $items = $query->orderBy('created_at', 'desc')->limit($limit)->get();

        return $items->map(function (ShippingSession $session) {
            $statusLabel = match ($session->status) {
                ShippingSessionStatus::IN_TRANSIT => 'Dalam Perjalanan',
                ShippingSessionStatus::DELIVERED  => 'Terkirim',
                ShippingSessionStatus::PENDING    => 'Menunggu',
                ShippingSessionStatus::CANCELLED  => 'Dibatalkan',
                default                           => ucfirst((string) ($session->status->value ?? $session->status)),
            };

            $routeText = ($session->origin && $session->destination)
                ? "{$session->origin} → {$session->destination}"
                : ($session->destination ?? $session->origin ?? 'Rute Operasional');

            $customerName = $session->customer?->company_name ?? '';
            $cpName = $session->currentCheckpoint?->name ?? 'Belum ada Checkpoint';

            return [
                'id'             => (string) $session->id,
                'category'       => 'barang',
                'category_label' => 'Barang / Tracking',
                'title'          => $session->cargo_name,
                'subtitle'       => "{$session->assignment_no} Â· {$routeText} Â· {$customerName}",
                'status'         => $statusLabel,
                'status_type'    => strtolower((string) ($session->status->value ?? $session->status)),
                'url'            => '/monitoring-barang',
                'metadata'       => [
                    'assignment_no' => $session->assignment_no,
                    'cargo_name'    => $session->cargo_name,
                    'customer'      => $customerName,
                    'checkpoint'    => $cpName,
                    'quantity'      => "{$session->total_quantity} {$session->unit}",
                ],
            ];
        })->all();
    }

    /**
     * 2. Search Sesi Pekerja (ShippingSession + SessionCheckpoints)
     */
    private function searchSesiPekerja(User $user, string $keyword, int $limit): array
    {
        $lower = '%' . strtolower($keyword) . '%';
        $query = ShippingSession::with([
            'sessionCheckpoints.picUser',
            'sessionCheckpoints.checkpoint',
            'customer',
            'currentCheckpoint'
        ]);

        // -- Role Authorization Scoping --
        if ($user->hasRole(UserRole::Customer->value)) {
            return []; // Customers do not access internal work sessions
        } elseif ($user->hasRole(UserRole::FieldWorker->value)) {
            $query->whereHas('sessionCheckpoints', function ($sq) use ($user) {
                $sq->where('pic_user_id', $user->id);
            });
        }

        // -- Search Filters --
        $query->where(function ($q) use ($lower) {
            $q->whereRaw('LOWER(assignment_no) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(cargo_name) LIKE ?', [$lower])
              ->orWhereHas('sessionCheckpoints', function ($sq) use ($lower) {
                  $sq->whereHas('picUser', function ($uq) use ($lower) {
                      $uq->whereRaw('LOWER(name) LIKE ?', [$lower]);
                  })->orWhereHas('checkpoint', function ($cpq) use ($lower) {
                      $cpq->whereRaw('LOWER(name) LIKE ?', [$lower]);
                  });
              });
        });

        $items = $query->orderBy('created_at', 'desc')->limit($limit)->get();

        return $items->map(function (ShippingSession $session) {
            $picNames = $session->sessionCheckpoints
                ->map(fn($scp) => $scp->picUser?->name)
                ->filter()
                ->unique()
                ->implode(', ');

            if ($picNames === '') {
                $picNames = 'Belum Ada Petugas';
            }

            $currentCheckpoint = $session->currentCheckpoint?->name
                ?? $session->sessionCheckpoints->first()?->checkpoint?->name
                ?? 'Tahap Logistik';

            $statusLabel = match ($session->status) {
                ShippingSessionStatus::IN_TRANSIT => 'Aktif',
                ShippingSessionStatus::DELIVERED  => 'Selesai',
                ShippingSessionStatus::PENDING    => 'Menunggu',
                default                           => 'Aktif',
            };

            return [
                'id'             => (string) $session->id,
                'category'       => 'sesi',
                'category_label' => 'Sesi Pekerja',
                'title'          => "{$session->assignment_no} â€” {$session->cargo_name}",
                'subtitle'       => "Petugas: {$picNames} Â· Checkpoint: {$currentCheckpoint}",
                'status'         => $statusLabel,
                'status_type'    => $statusLabel === 'Aktif' ? 'active' : 'completed',
                'url'            => '/sesi-pekerja',
                'metadata'       => [
                    'session_id' => $session->assignment_no,
                    'cargo'      => $session->cargo_name,
                    'worker'     => $picNames,
                    'stage'      => $currentCheckpoint,
                ],
            ];
        })->all();
    }

    /**
     * 3. Search Dokumen (Document)
     */
    private function searchDokumen(User $user, string $keyword, int $limit): array
    {
        $lower = '%' . strtolower($keyword) . '%';
        $query = Document::with(['documentType', 'shippingSession.customer', 'uploadedBy', 'verifiedBy']);

        // -- Role Authorization Scoping --
        if ($user->hasRole(UserRole::Customer->value)) {
            $customer = $this->getCustomerForUser($user);
            if (!$customer) return [];
            $query->whereHas('shippingSession', function ($sq) use ($customer) {
                $sq->where('customer_id', $customer->id);
            });
        } elseif ($user->hasRole(UserRole::FieldWorker->value)) {
            $query->whereHas('shippingSession.sessionCheckpoints', function ($sq) use ($user) {
                $sq->where('pic_user_id', $user->id);
            });
        }

        // -- Search Filters --
        $query->where(function ($q) use ($lower) {
            $q->whereRaw('LOWER(file_name) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(remarks) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(CAST(document_data AS TEXT)) LIKE ?', [$lower])
              ->orWhereHas('documentType', function ($tq) use ($lower) {
                  $tq->whereRaw('LOWER(name) LIKE ?', [$lower]);
              })
              ->orWhereHas('shippingSession', function ($sq) use ($lower) {
                  $sq->whereRaw('LOWER(assignment_no) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(cargo_name) LIKE ?', [$lower])
                    ->orWhereHas('customer', function ($cq) use ($lower) {
                        $cq->whereRaw('LOWER(company_name) LIKE ?', [$lower]);
                    });
              });
        });

        $items = $query->orderBy('created_at', 'desc')->limit($limit)->get();

        return $items->map(function (Document $doc) use ($user) {
            $docData = (array) ($doc->document_data ?? []);
            $docNumber = $docData['document_number'] ?? null;
            $typeName = $doc->documentType?->name ?? 'Dokumen Logistik';
            $sessionNo = $doc->shippingSession?->assignment_no ?? '';
            $cargoName = $doc->shippingSession?->cargo_name ?? '';
            $customerName = $doc->shippingSession?->customer?->company_name ?? '';

            $primaryTitle = $docNumber ? "{$docNumber} ({$typeName})" : $typeName;
            $subtitleParts = array_filter([$cargoName, $sessionNo, $customerName]);
            $subtitle = implode(' Â· ', $subtitleParts);
            if ($subtitle === '') {
                $subtitle = $doc->file_name;
            }

            $statusVal = $doc->status instanceof DocumentStatus ? $doc->status->value : (string) $doc->status;
            $statusLabel = match (strtoupper($statusVal)) {
                'APPROVED' => 'Disetujui',
                'REJECTED' => 'Ditolak',
                'PENDING'  => 'Menunggu',
                default    => ucfirst(strtolower($statusVal)),
            };

            $url = $user->hasRole(UserRole::Supervisor->value) ? '/verifikasi-berkas' : '/submit-dokumen';

            return [
                'id'             => (string) $doc->id,
                'category'       => 'dokumen',
                'category_label' => 'Dokumen',
                'title'          => $primaryTitle,
                'subtitle'       => $subtitle,
                'status'         => $statusLabel,
                'status_type'    => strtolower($statusVal),
                'url'            => $url,
                'metadata'       => [
                    'doc_number' => $docNumber,
                    'type'       => $typeName,
                    'file_name'  => $doc->file_name,
                    'shipment'   => $sessionNo,
                    'remarks'    => $doc->remarks,
                ],
            ];
        })->all();
    }

    /**
     * 4. Search Checkpoint (Checkpoint + Active Session summary)
     */
    private function searchCheckpoint(User $user, string $keyword, int $limit): array
    {
        $lower = '%' . strtolower($keyword) . '%';
        $query = Checkpoint::with(['shippingSessions' => function ($sq) use ($user) {
            if ($user->hasRole(UserRole::Customer->value)) {
                $customer = $this->getCustomerForUser($user);
                if ($customer) {
                    $sq->where('customer_id', $customer->id);
                } else {
                    $sq->whereRaw('1 = 0');
                }
            } elseif ($user->hasRole(UserRole::FieldWorker->value)) {
                $sq->whereHas('sessionCheckpoints', function ($scq) use ($user) {
                    $scq->where('pic_user_id', $user->id);
                });
            }
        }]);

        $query->where(function ($q) use ($lower) {
            $q->whereRaw('LOWER(name) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(description) LIKE ?', [$lower])
              ->orWhereHas('shippingSessions', function ($sq) use ($lower) {
                  $sq->whereRaw('LOWER(assignment_no) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(cargo_name) LIKE ?', [$lower]);
              });
        });

        $items = $query->orderBy('sequence', 'asc')->limit($limit)->get();

        return $items->map(function (Checkpoint $cp) {
            $activeCount = $cp->shippingSessions->count();
            $unitText = $activeCount > 0 ? "{$activeCount} Unit Terpantau" : '0 Unit Terpantau';

            $units = $cp->shippingSessions->pluck('cargo_name')->take(2)->implode(', ');
            $desc = $cp->description ?: "Tahap Urutan #{$cp->sequence}";
            $subtitle = $units ? "{$desc} Â· Unit: {$units}" : "{$desc} Â· Urutan #{$cp->sequence}";

            return [
                'id'             => (string) $cp->id,
                'category'       => 'checkpoint',
                'category_label' => 'Checkpoint',
                'title'          => "Checkpoint {$cp->name}",
                'subtitle'       => $subtitle,
                'status'         => $unitText,
                'status_type'    => 'checkpoint',
                'url'            => '/monitoring-cp',
                'metadata'       => [
                    'sequence'     => $cp->sequence,
                    'name'         => $cp->name,
                    'active_units' => $activeCount,
                ],
            ];
        })->all();
    }

    /**
     * 5. Search Users / Kelola Akun
     */
    private function searchUsers(User $user, string $keyword, int $limit): array
    {
        $lower = '%' . strtolower($keyword) . '%';
        $query = User::with('roles');

        // Supervisor can only view non-admin operational users
        if ($user->hasRole(UserRole::Supervisor->value)) {
            $query->whereDoesntHave('roles', function ($rq) {
                $rq->whereIn('name', [UserRole::SuperAdmin->value]);
            });
        }

        $query->where(function ($q) use ($lower) {
            $q->whereRaw('LOWER(name) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(email) LIKE ?', [$lower])
              ->orWhereRaw('LOWER(phone) LIKE ?', [$lower])
              ->orWhereHas('roles', function ($rq) use ($lower) {
                  $rq->whereRaw('LOWER(name) LIKE ?', [$lower]);
              });
        });

        $items = $query->orderBy('name', 'asc')->limit($limit)->get();

        return $items->map(function (User $u) {
            $firstRole = $u->roles->first()?->name;
            $roleLabel = match ($firstRole) {
                'super-admin'  => 'Super Admin',
                'supervisor'   => 'Supervisor',
                'staff'        => 'Staff',
                'field-worker' => 'Field Worker',
                'customer'     => 'Customer',
                default        => ucfirst($firstRole ?? 'User'),
            };

            $statusLabel = $u->status === UserStatus::Active ? 'Aktif' : 'Tidak Aktif';

            return [
                'id'             => (string) $u->id,
                'category'       => 'users',
                'category_label' => 'Pengguna',
                'title'          => $u->name,
                'subtitle'       => "{$roleLabel} Â· {$u->email}" . ($u->phone ? " Â· {$u->phone}" : ''),
                'status'         => $statusLabel,
                'status_type'    => $u->status === UserStatus::Active ? 'active' : 'inactive',
                'url'            => '/kelola-akun',
                'metadata'       => [
                    'email' => $u->email,
                    'role'  => $roleLabel,
                    'phone' => $u->phone,
                ],
            ];
        })->all();
    }
}