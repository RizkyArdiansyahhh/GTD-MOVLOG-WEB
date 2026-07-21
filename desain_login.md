Buat satu halaman Sign In untuk GlobalTransDjaya. Halaman ini adalah entry point langsung — tidak ada landing page/hero terlebih dahulu, begitu dibuka user langsung melihat form login.

Style, font, transisi, dan sistem desain (liquid-glass) diambil dari prompt space-travel landing page sebelumnya. Konten form mengikuti brief Sign In GlobalTransDjaya.

---

## Fonts (dipertahankan dari prompt space-travel)

Google Fonts:
```
family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600
```

Tailwind config:
- `font-heading` → `'Instrument Serif', serif` (dipakai italic) — untuk judul "Masuk ke Akun"
- `font-body` → `'Barlow', sans-serif` — untuk label, input, teks tombol, link

Default border radius override: `DEFAULT: "9999px"` (bare `rounded` → pill), dipertahankan untuk konsistensi tombol dan chip.

---

## Liquid-Glass Design System (dipertahankan persis)

```css
.liquid-glass {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%,
    rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%,
    rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%,
    rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.liquid-glass-strong {
  backdrop-filter: blur(50px);
  box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
}
```
`.liquid-glass-strong::before` sama seperti `.liquid-glass::before`, hanya stop gradient 0.5 / 0.2 / 0 / 0 / 0.2 / 0.5.

Karena background halaman sekarang **terang** (surface-main), bukan hitam seperti versi space-travel, sesuaikan opacity liquid-glass agar tetap terbaca di atas latar terang — gunakan `.liquid-glass` untuk card form (bukan gelap penuh), border tetap tipis, isi teks pakai warna gelap (`text-foreground`), bukan putih.

---

## Warna

- Background halaman: `surface-main` (light, misalnya `#F7F7F5` atau setara)
- Aksen brand/gold: `#f5b800` — dipakai untuk tombol "Masuk" dan elemen fokus/highlight
- Teks utama: dark charcoal (bukan putih seperti versi space-travel, karena background sekarang terang)

---

## Header / Navbar (style dipertahankan, disederhanakan karena halaman ini standalone)

Karena tidak ada page awal/beranda, navbar tidak perlu nav links (Home, Voyages, dst dihapus) — cukup menampilkan logo brand:

- Posisi: fixed top-6, px-8, z-50
- Kiri (atau center, pilih center untuk kesan standalone): 48×48 `liquid-glass` circle berisi logo GlobalTransDjaya (bukan huruf "a" italic lagi)
- Tidak ada tombol CTA di navbar (CTA utama ada di dalam card form, bukan di header)

Framer Motion entrance navbar: fade + blur-in, sama seperti pattern asli — `initial: { filter: 'blur(10px)', opacity: 0, y: 20 }`, `ease: easeOut`, delay 0.2s.

---

## Card Sign In (menggantikan Hero content, layout & animasi dipertahankan)

Layout: centered card di tengah viewport (bisa juga split-screen dengan panel branding kiri/kanan bila mau versi lebih kaya — pilih centered untuk versi minimalis sesuai brief).

Container card: `liquid-glass rounded-[1.25rem] p-8 md:p-10 max-w-[420px] w-full`, di atas background `surface-main`.

**Urutan elemen di dalam card, dengan animasi Framer Motion mengikuti pola stagger delay dari versi space-travel:**

1. **Logo GlobalTransDjaya** (di atas judul, mb-6) — delay 0.2s, animasi sama: blur-in + fade + y:20 → 0

2. **Judul — pakai BlurText component** (word-by-word blur-in, dipertahankan persis dari spesifikasi lama: IntersectionObserver 10%, tiap kata `motion.span`, 3-step keyframes blur 10px→5px→0px, stagger 100ms per kata, ease easeOut, duration 0.7s)
   Teks: **"Masuk ke Akun"**
   Class: `font-heading italic text-foreground text-4xl md:text-5xl leading-[0.95] tracking-[-2px]` (skala diperkecil dari versi hero karena ini card, bukan headline full-viewport)

3. **Form fields** (delay 0.6s, fade up dari y:16):
   - Label + input **Email** — `font-body`, border tipis, rounded-md, focus ring pakai warna gold `#f5b800`
   - Label + input **Kata Sandi** — sama style, dengan toggle show/hide password (opsional)
   - Link **"Lupa Kata Sandi?"** — text-sm, di kanan atas field password, `font-body`, underline on hover

4. **Tombol Sign In** (delay 0.9s, fade up dari y:16):
   - Teks: **"Masuk"**
   - Style: rounded-full (pill, sesuai default radius override), bg `#f5b800`, text warna gelap atau putih (pilih kontras terbaik — hitam di atas gold biasanya lebih terbaca), font-body font-medium, w-full, py-3
   - Hover: sedikit darken/brighten transisi 0.2s (tanpa CSS transition di video seperti versi asli, tapi untuk tombol biasa CSS transition tetap boleh dipakai)

5. **Link daftar** (delay 1.0s, fade in):
   Teks: **"Belum punya akun? Daftar"** — `font-body text-sm text-foreground/70`, bagian "Daftar" digarisbawahi/warna gold sebagai link

---

## Yang Dihapus dari Prompt Space-Travel

- Kedua video background (Hero & Capabilities) beserta `FadingVideo` component dan seluruh logic crossfade rAF
- Section Capabilities (kicker, heading "Production evolved", 3 card kemampuan, icon Material Design)
- Badge "New — Maiden Crewed Voyage to Mars"
- Subheading tentang eksplorasi luar angkasa
- Stats row (34.5 Min / 2.8B+)
- Partners row (Aeon · Vela · Apex · Orbit · Zeno)
- Nav links di navbar (Home, Voyages, Worlds, Innovation, Plan Launch) dan tombol "Claim a Spot"
- Icon ArrowUpRight & Play (tidak relevan untuk form login)
- Semua teks/warna putih-di-atas-hitam — diganti skema terang sesuai brand GlobalTransDjaya

**Yang dipertahankan:** sistem font (Instrument Serif italic + Barlow), sistem liquid-glass (dengan penyesuaian opacity untuk background terang), pola animasi Framer Motion (blur-in + fade + y-offset dengan stagger delay), dan BlurText word-by-word component untuk judul.

---

## Teks UI (Bahasa Indonesia, sesuai brief)

- Judul: "Masuk ke Akun"
- Label: "Email"
- Label: "Kata Sandi"
- Link: "Lupa Kata Sandi?"
- Tombol: "Masuk"
- Link bawah: "Belum punya akun? Daftar"
