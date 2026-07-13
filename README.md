# 📦 Logistics Management System

Sistem Manajemen Logistik berbasis Laravel 12 dengan arsitektur berlapis (Layered Architecture), siap untuk pengembangan jangka panjang dalam skala menengah hingga besar.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 12, PHP 8.4 |
| **Frontend** | Inertia.js, React 19, TypeScript, Tailwind CSS v4 |
| **Database** | PostgreSQL 17 |
| **Cache / Queue** | Redis 7 |
| **Authentication** | Laravel Sanctum |
| **Authorization** | Laravel Policy + Spatie Laravel Permission |
| **Storage** | Laravel Storage |
| **Dev Environment** | Docker, Docker Compose, Nginx |

---

## 🏗️ Arsitektur

Project ini menggunakan **Layered Architecture** yang memisahkan setiap tanggung jawab secara tegas.

### Alur Request

```
HTTP Request
    ↓
Route (routes/web.php | routes/api.php)
    ↓
Controller (thin — hanya menerima & merespons)
    ↓
Form Request (validasi)
    ↓
Service (seluruh business logic)
    ↓
Repository (query database)
    ↓
Eloquent Model
    ↓
Database (PostgreSQL)
```

### Penjelasan Setiap Layer

#### Controller (`app/Http/Controllers/`)
**Tugasnya:**
- Menerima HTTP request
- Memanggil Form Request untuk validasi (otomatis)
- Memanggil Service yang relevan
- Mengembalikan response (API Resource / Inertia)

**TIDAK BOLEH:**
- Mengandung business logic
- Mengakses database secara langsung
- Melakukan validasi manual

> Controller dibagi menjadi dua subfolder:
> - `Api/` — untuk REST API (Flutter)
> - `Web/` — untuk Admin Dashboard (Inertia.js)

---

#### Service (`app/Services/`)
**Tugasnya:**
- Mengandung SEMUA business logic
- Mengorkestrasikan operasi lintas domain
- Menggunakan Repository untuk akses data
- Menggunakan Database Transaction jika memodifikasi lebih dari satu tabel

**Contoh business logic:**
- Membuat Assignment Shipment
- Generate Checkpoint Delivery
- Verifikasi Dokumen Driver
- Hitung biaya pengiriman
- Kirim notifikasi

---

#### Repository (`app/Repositories/`)
**Tugasnya:**
- Query database menggunakan Eloquent
- Create, Update, Delete record
- Search / Filter data

**TIDAK BOLEH:**
- Mengandung business logic
- Memanggil Service lain

> Setiap Repository memiliki Interface (Contracts) dan implementasinya (Eloquent):
> - `Contracts/` — interface yang di-bind di AppServiceProvider
> - `Eloquent/` — implementasi konkret menggunakan Eloquent

---

#### Form Request (`app/Http/Requests/`)
- Seluruh validasi wajib di sini
- Juga berisi otorisasi level request (apakah user boleh mengakses endpoint ini)
- Tidak ada validasi manual di Controller

---

#### DTO (`app/DTOs/`)
- Data Transfer Object untuk memindahkan data antar layer dengan type-safe
- Menggunakan `spatie/laravel-data`
- Mencegah array kemanasana tanpa struktur yang jelas

---

#### Enum (`app/Enums/`)
- Menggantikan magic string/number
- Setiap status, tipe, atau kategori harus jadi Enum
- Contoh: `UserStatus`, `UserRole`, `ShipmentStatus`

---

#### Policy (`app/Policies/`)
- Mendefinisikan aturan otorisasi berbasis resource
- Digunakan dengan `$this->authorize()` di Controller
- Super-admin bypass via `before()` method

---

#### Exception (`app/Exceptions/`)
- `BusinessException` — untuk pelanggaran business rule dari Service
- Handler akan memformat exception ini sebagai JSON response

---

#### Trait (`app/Traits/`)
- `ApiResponseTrait` — standarisasi format response JSON untuk API Controller

---

## 📁 Struktur Folder

```
app/
├── Actions/            # Single-action classes (opsional, untuk operasi atomik)
├── DTOs/               # Data Transfer Objects (spatie/laravel-data)
├── Enums/              # PHP 8.1+ Backed Enums
├── Exceptions/         # Custom exceptions
├── Helpers/            # Global helper functions
├── Http/
│   ├── Controllers/
│   │   ├── Api/        # REST API controllers (Flutter)
│   │   └── Web/        # Inertia.js controllers (Dashboard)
│   ├── Middleware/     # Custom HTTP middleware
│   ├── Requests/       # Form Request validation classes
│   └── Resources/      # API Resource transformers
├── Jobs/               # Queued jobs
├── Models/             # Eloquent models
├── Notifications/      # Laravel Notifications
├── Policies/           # Authorization policies
├── Providers/          # Service providers (AppServiceProvider)
├── Repositories/
│   ├── Contracts/      # Repository interfaces
│   └── Eloquent/       # Eloquent implementations
├── Services/           # Business logic layer
└── Traits/             # Reusable PHP traits

routes/
├── api.php             # REST API routes (prefix: /api/v1/)
└── web.php             # Admin dashboard routes (Inertia.js)

resources/
├── css/
│   └── app.css         # Tailwind CSS v4 entrypoint
└── js/
    ├── app.tsx         # Inertia app entrypoint
    ├── Layouts/        # Shared page layouts
    ├── Pages/          # Inertia page components
    │   ├── Auth/
    │   ├── Dashboard/
    │   └── Users/
    ├── Components/     # Reusable UI components
    ├── lib/            # Utility functions
    └── types/          # TypeScript type definitions

docker/
├── app/
│   ├── Dockerfile      # PHP 8.4 FPM image
│   ├── php.ini         # PHP configuration
│   └── opcache.ini     # OPcache configuration
├── nginx/
│   ├── nginx.conf      # Nginx main config
│   └── default.conf    # Server block
└── postgres/
    └── init.sql        # DB initialization script

database/
├── migrations/         # Database migrations
└── seeders/
    ├── DatabaseSeeder.php
    ├── RoleSeeder.php       # Roles & permissions
    └── AdminUserSeeder.php  # Default admin users

tests/
├── Feature/
│   └── Api/            # HTTP layer tests
└── Unit/
    └── Services/       # Business logic tests (mocked)
```

---

## 🐳 Setup dengan Docker

### 1. Clone & masuk ke folder project

```bash
git clone <repo-url> lms
cd lms
```

### 2. Copy environment file

```bash
cp .env.example .env
```

### 3. Jalankan semua container

```bash
docker compose up -d
```

### 4. Install dependencies & migrate

```bash
# Install PHP dependencies
docker compose exec app composer install

# Generate app key
docker compose exec app php artisan key:generate

# Run migrations & seeders
docker compose exec app php artisan migrate --seed

# Install JS dependencies & build assets
docker compose exec app npm install
docker compose exec app npm run dev
```

### 5. Akses aplikasi

| URL | Keterangan |
|---|---|
| http://localhost:8080 | Admin Dashboard |
| http://localhost:8080/api/v1/ | REST API |
| http://localhost:5050 | pgAdmin (DB GUI) |

### Akun Default

| Email | Password | Role |
|---|---|---|
| superadmin@lms.local | Admin@1234 | Super Admin |
| admin@lms.local | Admin@1234 | Admin |
| manager@lms.local | Admin@1234 | Manager |

---

## ⌨️ Makefile Commands

```bash
make up           # Start semua containers
make down         # Stop containers
make shell        # Masuk ke container app (bash)
make migrate      # Jalankan migrations
make seed         # Jalankan seeders
make fresh        # migrate:fresh --seed
make test         # Jalankan PHPUnit tests
make lint         # Jalankan Laravel Pint (PSR-12)
make cache-clear  # Bersihkan semua cache
make setup        # Full setup dari awal
```

---

## 🔌 REST API

Base URL: `/api/v1`

### Authentication

```
POST   /api/v1/auth/login       Login & dapatkan token
POST   /api/v1/auth/register    Registrasi user baru
POST   /api/v1/auth/logout      Logout (hapus token)
GET    /api/v1/auth/me          Data user yang login
```

### Users (auth required)

```
GET    /api/v1/users            Daftar users (dengan search & pagination)
POST   /api/v1/users            Buat user baru
GET    /api/v1/users/{id}       Detail user
PUT    /api/v1/users/{id}       Update user
DELETE /api/v1/users/{id}       Hapus user
```

### Format Response API

```json
{
    "success": true,
    "message": "Request successful.",
    "data": { ... }
}
```

### Format Response Paginasi

```json
{
    "success": true,
    "message": "Request successful.",
    "data": [ ... ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 15,
        "total": 72
    },
    "links": {
        "first": "...",
        "last": "...",
        "prev": null,
        "next": "..."
    }
}
```

---

## 🧪 Testing

Project menggunakan dua jenis test:

### Unit Tests (`tests/Unit/`)
Menguji business logic di Service layer menggunakan mocked repository.
Tidak memerlukan koneksi database.

```bash
php artisan test --testsuite=Unit
```

### Feature Tests (`tests/Feature/`)
Menguji full HTTP request lifecycle: routing → controller → service → database.

```bash
php artisan test --testsuite=Feature
```

### Jalankan semua tests

```bash
php artisan test --parallel
# atau
make test
```

---

## 🏷️ Konvensi Penamaan

| Komponen | Format | Contoh |
|---|---|---|
| Controller | `{Domain}Controller` | `UserController`, `ShipmentController` |
| Service | `{Domain}Service` | `UserService`, `ShipmentService` |
| Repository Interface | `{Domain}RepositoryInterface` | `UserRepositoryInterface` |
| Repository | `{Domain}Repository` | `UserRepository` |
| Form Request | `{Action}{Domain}Request` | `StoreUserRequest`, `UpdateUserRequest` |
| API Resource | `{Domain}Resource` | `UserResource`, `ShipmentResource` |
| DTO | `{Domain}DTO` | `UserDTO`, `ShipmentDTO` |
| Policy | `{Domain}Policy` | `UserPolicy`, `ShipmentPolicy` |
| Enum | `{Domain}{Type}` | `UserStatus`, `UserRole`, `ShipmentStatus` |

---

## 📐 Coding Standards

- **PHP Standard**: PSR-12
- **PHP Strict Types**: Wajib di semua file (`declare(strict_types=1)`)
- **Constructor Property Promotion**: Digunakan untuk semua DI
- **Readonly Properties**: Digunakan di DTO dan Value Objects
- **Type Hints**: Wajib untuk semua parameter dan return types
- **Linting**: Laravel Pint (`./vendor/bin/pint`)

---

## 🔐 Roles & Permissions

| Role | Deskripsi |
|---|---|
| `super-admin` | Akses penuh ke seluruh sistem |
| `admin` | Manajemen user, shipment, driver, laporan |
| `manager` | Monitoring dan penugasan shipment |
| `driver` | Melihat shipment yang ditugaskan |
| `warehouse` | Manajemen gudang |
| `customer` | Tracking shipment |

---

## 🔧 Menambahkan Domain Baru

Contoh: menambahkan domain **Shipment**

```bash
# 1. Buat Interface Repository
app/Repositories/Contracts/ShipmentRepositoryInterface.php

# 2. Buat Eloquent Repository
app/Repositories/Eloquent/ShipmentRepository.php

# 3. Bind di AppServiceProvider
$this->app->bind(ShipmentRepositoryInterface::class, ShipmentRepository::class);

# 4. Buat Service
app/Services/ShipmentService.php

# 5. Buat DTO
app/DTOs/ShipmentDTO.php

# 6. Buat Enum (jika ada)
app/Enums/ShipmentStatus.php

# 7. Buat Form Requests
app/Http/Requests/Shipment/StoreShipmentRequest.php
app/Http/Requests/Shipment/UpdateShipmentRequest.php

# 8. Buat API Resource
app/Http/Resources/ShipmentResource.php

# 9. Buat Controllers
app/Http/Controllers/Api/ShipmentController.php
app/Http/Controllers/Web/ShipmentController.php

# 10. Buat Policy
app/Policies/ShipmentPolicy.php

# 11. Register Policy di AppServiceProvider
Gate::policy(Shipment::class, ShipmentPolicy::class);

# 12. Tambahkan routes
routes/api.php  → Route::apiResource('shipments', ShipmentController::class)
routes/web.php  → Route::resource('shipments', ShipmentController::class)
```

---

## 📝 License

Internal use only — Logistics Management System.
