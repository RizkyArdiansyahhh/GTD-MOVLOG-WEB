import type { QuickFilterType, FileFormatOption, DownloadHistoryItem } from '../types/laporan';

export interface QuickFilterOption {
  id: QuickFilterType;
  label: string;
}

export const QUICK_FILTER_OPTIONS: QuickFilterOption[] = [
  { id: '7_hari', label: 'Last 7 Days' },
  { id: 'bulan_ini', label: 'This Month' },
  { id: 'kuartal_terakhir', label: 'Last Quarter' },
];

export const FILE_FORMAT_OPTIONS: FileFormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF',
    subLabel: 'PDF Document',
    description: 'Suitable for digital archiving and printing.',
    iconType: 'pdf',
  },
  {
    id: 'excel',
    name: 'Excel / CSV',
    subLabel: 'Excel / CSV',
    description: 'Suitable for raw data processing.',
    iconType: 'excel',
  },
];

export const INITIAL_DOWNLOAD_HISTORY: DownloadHistoryItem[] = [
  {
    id: 'RPT-2023-001',
    name: 'Shipment Report October 2023',
    format: 'pdf',
    createdAt: '28 Okt 2023, 14:30',
    fileSize: '2.4 MB',
    status: 'Ready',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2023-002',
    name: 'Routine Logistics - Q3 2023',
    format: 'excel',
    createdAt: '15 Okt 2023, 09:15',
    fileSize: '4.8 MB',
    status: 'Ready',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2023-003',
    name: 'Fleet & Distribution Summary Sep 2023',
    format: 'pdf',
    createdAt: '30 Sep 2023, 17:45',
    fileSize: '1.9 MB',
    status: 'Expired',
  },
  {
    id: 'RPT-2023-004',
    name: 'Cargo & Route Summary Sep 2023',
    format: 'excel',
    createdAt: '12 Sep 2023, 11:20',
    fileSize: '3.1 MB',
    status: 'Expired',
  },
  {
    id: 'RPT-2023-005',
    name: 'Shipment Report August 2023',
    format: 'pdf',
    createdAt: '31 Agu 2023, 16:00',
    fileSize: '2.1 MB',
    status: 'Ready',
    downloadUrl: '#',
  },
];
