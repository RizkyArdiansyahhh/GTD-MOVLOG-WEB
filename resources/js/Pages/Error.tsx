import { Head, usePage } from '@inertiajs/react';
import Toast from '@/Components/Toast';

const errors: Record<number, { title: string; description: string; retry?: boolean }> = {
    403: {
        title: 'Akses tidak diizinkan',
        description: 'Anda tidak memiliki izin untuk membuka halaman ini. Hubungi administrator jika Anda memerlukan akses.',
    },
    404: {
        title: 'Halaman tidak ditemukan',
        description: 'Halaman yang Anda cari tidak tersedia. Periksa kembali alamatnya atau kembali ke dashboard.',
    },
    419: {
        title: 'Sesi telah berakhir',
        description: 'Sesi Anda tidak lagi berlaku. Buka kembali aplikasi, lalu coba lagi.',
    },
    429: {
        title: 'Terlalu banyak permintaan',
        description: 'Mohon tunggu beberapa saat sebelum membuka halaman ini kembali.',
        retry: true,
    },
    500: {
        title: 'Terjadi kendala pada sistem',
        description: 'Permintaan Anda belum dapat diproses. Silakan coba lagi beberapa saat lagi.',
        retry: true,
    },
    503: {
        title: 'Layanan sementara tidak tersedia',
        description: 'Sistem sedang dalam pemeliharaan atau mengalami gangguan. Silakan kembali beberapa saat lagi.',
        retry: true,
    },
};

interface ErrorProps {
    status: number;
    home?: string;
}

export default function ErrorPage({ status, home = '/login' }: ErrorProps) {
    const { url } = usePage();
    const error = errors[status] ?? errors[500];
    const homeLabel = home === '/login'
        ? 'Ke halaman masuk'
        : home === '/welcome' ? 'Ke halaman awal' : 'Kembali ke dashboard';
    const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-navy-dark';

    return (
        <div className="min-h-dvh bg-bg-page font-sans text-text-body flex flex-col">
            <Head title={`${status} — ${error.title}`} />
            <Toast />
            <header className="border-b border-border-subtle">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5 sm:px-10">
                    <img src="/logo.png" alt="Global Trans Djaya" className="h-9 w-9 object-contain" />
                    <div>
                        <p className="text-sm font-semibold text-brand-navy-dark">GTD MoveLog</p>
                        <p className="text-xs text-text-secondary">Global Trans Djaya</p>
                    </div>
                </div>
            </header>
            <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-12 sm:px-10">
                <section aria-labelledby="error-title" className="max-w-xl">
                    <p className="mb-5 text-5xl font-semibold tracking-tight text-text-secondary sm:text-6xl">{status}</p>
                    <h1 id="error-title" className="text-2xl font-semibold leading-tight text-brand-navy-dark sm:text-3xl">{error.title}</h1>
                    <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">{error.description}</p>
                    <nav aria-label="Navigasi halaman error" className="mt-8 flex flex-col gap-3 sm:flex-row">
                        {/* Plain GET links recover even after a failed mutation;
                            no history.back(), form replay or automatic retries. */}
                        <a href={home} className={`inline-flex min-h-11 items-center justify-center rounded-md bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-navy-dark transition-colors hover:bg-brand-gold-hover ${focus}`}>
                            {homeLabel}
                        </a>
                        {error.retry && (
                            <a href={url || home} className={`inline-flex min-h-11 items-center justify-center rounded-md border border-border-muted px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-hover ${focus}`}>
                                Coba buka kembali
                            </a>
                        )}
                    </nav>
                </section>
            </main>
            <footer className="mx-auto w-full max-w-5xl px-6 py-5 text-xs text-text-secondary sm:px-10">
                GTD MoveLog · Logistics Management System
            </footer>
        </div>
    );
}
