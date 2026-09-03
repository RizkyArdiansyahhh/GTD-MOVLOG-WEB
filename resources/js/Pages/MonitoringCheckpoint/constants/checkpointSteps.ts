/**
 * PENTING: sejak types disesuaikan ke skema asli (tabel `checkpoints` sebagai
 * master data, dihubungkan via session_checkpoints), urutan & label checkpoint
 * SEHARUSNYA datang dari database (tabel `checkpoints`, kolom name + order/id),
 * bukan lagi hardcoded di sini.
 *
 * File ini disisakan hanya sebagai fallback label ketika data checkpoint
 * belum sempat di-load (mis. saat error state di frontend), dan sebagai
 * referensi total step untuk perhitungan progress bar sederhana.
 *
 * Jangan gunakan file ini sebagai sumber urutan/label yang ditampilkan ke user
 * pada halaman detail — gunakan `steps` yang dikirim controller dari backend.
 */

export const TOTAL_CHECKPOINT_STEPS = 4;

export const FALLBACK_CHECKPOINT_LABEL = "Not Started";