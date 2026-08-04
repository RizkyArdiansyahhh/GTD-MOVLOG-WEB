import type { QuickFilterType, FileFormatOption, DownloadHistoryItem } from '../types/laporan';

export interface QuickFilterOption {
  id: QuickFilterType;
  label: string;
}

export const QUICK_FILTER_OPTIONS: QuickFilterOption[] = [
  { id: '7_hari', label: '7 Hari Terakhir' },
  { id: 'bulan_ini', label: 'Bulan Ini' },
  { id: 'kuartal_terakhir', label: 'Kuartal Terakhir' },
];

export const FILE_FORMAT_OPTIONS: FileFormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF',
    subLabel: 'PDF Document',
    description: 'Sesuai untuk arsip digital dan pencetakan.',
    iconType: 'pdf',
  },
  {
    id: 'excel',
    name: 'Excel / CSV',
    subLabel: 'Excel / CSV',
    description: 'Sesuai untuk pengolahan data mentah.',
    iconType: 'excel',
  },
];

export const INITIAL_DOWNLOAD_HISTORY: DownloadHistoryItem[] = [
  {
    id: 'RPT-2023-001',
    name: 'Laporan Pengiriman Oktober 2023',
    format: 'pdf',
    createdAt: '28 Okt 2023, 14:30',
    fileSize: '2.4 MB',
    status: 'Siap Unduh',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2023-002',
    name: 'Logistik Rutin - Q3 2023',
    format: 'excel',
    createdAt: '15 Okt 2023, 09:15',
    fileSize: '4.8 MB',
    status: 'Siap Unduh',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2023-003',
    name: 'Rekap Armada & Distribusi Sep 2023',
    format: 'pdf',
    createdAt: '30 Sep 2023, 17:45',
    fileSize: '1.9 MB',
    status: 'Kedaluwarsa',
  },
  {
    id: 'RPT-2023-004',
    name: 'Ringkasan Muatan & Rute Sep 2023',
    format: 'excel',
    createdAt: '12 Sep 2023, 11:20',
    fileSize: '3.1 MB',
    status: 'Kedaluwarsa',
  },
  {
    id: 'RPT-2023-005',
    name: 'Laporan Pengiriman Agustus 2023',
    format: 'pdf',
    createdAt: '31 Agu 2023, 16:00',
    fileSize: '2.1 MB',
    status: 'Siap Unduh',
    downloadUrl: '#',
  },
];
