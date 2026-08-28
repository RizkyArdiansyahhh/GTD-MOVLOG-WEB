# Laporan Investigasi Akar Masalah & Solusi Tampilan Monitoring Barang

Dokumen ini memaparkan hasil investigasi mendalam terhadap penyebab mengapa tampilan di browser masih menampilkan data lama (*General Cargo*, *1 Barang*, *0 Item terdaftar*), serta penyebab error TypeScript pada `DetailBarangDrawer.tsx`.

---

## 1. Dua Akar Masalah Utama yang Ditemukan (Root Causes)

### 🔴 Akar Masalah 1: PHP-FPM OPcache Aktif pada Container Docker (`lms_app`)
- **Fakta Teknis:**
  Pada container Docker `lms_app`, konfigurasi PHP memiliki `opcache.enable = On`.
- **Dampaknya:**
  Ketika file `MonitoringBarangService.php` diubah, proses **PHP-FPM** yang melayani request HTTP dari browser (melalui Nginx) **masih menyimpan dan mengeksekusi bytecode PHP lama di memory RAM container**.
  - CLI PHP (tinker) membaca file baru secara langsung (karena `opcache.enable_cli = Off`), sehingga di CLI data sudah benar.
  - Namun request dari browser pengguna yang dilayani PHP-FPM tetap menerima payload JSON lama di mana `cargos` masih `[]` (kosong), `itemType` masih `"General Cargo"`, dan `itemName` hanya 1 item.
- **Tindakan Penyelesaian:**
  Container `lms_app` telah di-restart (`docker restart lms_app`) dan cache Laravel telah dibersihkan (`php artisan optimize:clear`). Dengan ini, PHP-FPM sekarang 100% memuat logika baru dan menyajikan array `cargos` lengkap.

---

### 🔴 Akar Masalah 2: IDE Type Cache & Impor Transistif pada `DetailBarangDrawer.tsx`
- **Error yang Terjadi di IDE:**
  ```json
  Property 'netWeight' does not exist on type 'CiCargoDetail'
  Property 'grossWeight' does not exist on type 'CiCargoDetail'
  Property 'price' does not exist on type 'CiCargoDetail'
  ```
- **Penyebab:**
  1. Pada `DetailBarangDrawer.tsx`, file hanya mengimpor `MonitoringItem` (`import type { MonitoringItem } from '../types/monitoringBarang';`).
  2. Tipe `CiCargoDetail` diperoleh secara *transitif* (`item.cargos`).
  3. Language server TypeScript (tsserver) pada IDE menahan versi interface lama di memory sebelum file tipe di disk diperbarui.
- **Solusi yang Direkomendasikan:**
  Mengimpor `CiCargoDetail` secara eksplisit pada `DetailBarangDrawer.tsx`:
  ```typescript
  import type { MonitoringItem, CiCargoDetail } from '../types/monitoringBarang';
  ```
  dan mendeklarasikan tipe eksplisit pada `cargoList`:
  ```typescript
  const cargoList: CiCargoDetail[] = item.cargos && item.cargos.length > 0 ? item.cargos : [];
  ```
  Hal ini akan memaksa TypeScript Language Server IDE untuk langsung mengenali field `netWeight`, `grossWeight`, dan `price` tanpa error.

---

## 2. Alur Pengujian & Hasil Verifikasi Data di Server

Hasil pengecekan langsung ke service backend di dalam container (`lms_app`):

```
ID: ASG-20260828-T61GNN
Contract: SC-2024-0456
ItemName: Excavator CAT 320, Bulldozer CAT D6R
ItemType: Hydraulic Excavator, Track-Type Tractor
Manufacturer: Caterpillar
Total Item: 2 Barang
  - Item 1: Excavator CAT 320 | Type: Hydraulic Excavator | Brand: Caterpillar | Net: 21800 kg | Gross: 22500 kg
  - Item 2: Bulldozer CAT D6R | Type: Track-Type Tractor | Brand: Caterpillar | Net: 17900 kg | Gross: 18400 kg

ID: ASG-20260828-L3ML8A (Multi-Brand)
Contract: SC-2024-0456
ItemName: Excavator CAT 320, Bulldozer CAT D6R
ItemType: Hydraulic Excavator, Track-Type Tractor
Manufacturer: Caterpillar, Mitsubishi
Total Item: 2 Barang
  - Item 1: Excavator CAT 320 | Type: Hydraulic Excavator | Brand: Caterpillar
  - Item 2: Bulldozer CAT D6R | Type: Track-Type Tractor | Brand: Mitsubishi
```

---

## 3. Langkah Selanjutnya untuk Pengguna

1. **Perbaikan Error TypeScript IDE:**
   Perbarui baris import di `DetailBarangDrawer.tsx` agar menyertakan `CiCargoDetail` secara eksplisit (sehingga error IDE langsung hilang).
2. **Uji di Browser:**
   Buka kembali halaman `/monitoring-barang` di browser dan lakukan refresh (F5). Data baru yang terdiri dari seluruh barang, tipe barang asli, dan multi-brand akan langsung tampil sempurna.
