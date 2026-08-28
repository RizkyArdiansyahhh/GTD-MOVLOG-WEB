import type { DateRangePreset, DownloadHistoryItem } from '../types/laporan';

export const DATE_RANGE_PRESETS: { key: DateRangePreset; label: string }[] = [
    { key: '7days', label: '7 Hari Terakhir' },
    { key: 'thisMonth', label: 'Bulan Ini' },
    { key: 'lastQuarter', label: 'Kuartal Terakhir' },
];

export const MOCK_DOWNLOAD_HISTORY: DownloadHistoryItem[] = [
    {
        id: '1',
        name: 'Laporan Pengiriman Juli 2025',
        format: 'pdf',
        createdAt: '2025-07-31 14:22',
        fileSize: '2.4 MB',
        status: 'ready',
        downloadUrl: '#',
    },
    {
        id: '2',
        name: 'Laporan Pengiriman Juni 2025',
        format: 'excel',
        createdAt: '2025-07-01 09:10',
        fileSize: '1.1 MB',
        status: 'ready',
        downloadUrl: '#',
    },
    {
        id: '3',
        name: 'Laporan Q1 2025',
        format: 'pdf',
        createdAt: '2025-04-05 11:00',
        fileSize: '5.8 MB',
        status: 'expired',
    },
    {
        id: '4',
        name: 'Laporan Pengiriman Mei 2025',
        format: 'excel',
        createdAt: '2025-06-03 16:45',
        fileSize: '980 KB',
        status: 'ready',
        downloadUrl: '#',
    },
    {
        id: '5',
        name: 'Laporan Harian 30 Jul 2025',
        format: 'pdf',
        createdAt: '2025-07-30 18:00',
        fileSize: '-',
        status: 'processing',
    },
];
