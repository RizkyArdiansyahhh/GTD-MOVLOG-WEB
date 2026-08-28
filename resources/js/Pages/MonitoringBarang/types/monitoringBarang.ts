export type ShippingStatus =
  | 'Menunggu'
  | 'Dalam Perjalanan'
  | 'Sampai Checkpoint'
  | 'Sampai Tujuan'
  | 'Terlambat'
  | 'Dibatalkan';

export type DocumentType =
  | 'Bill of Lading'
  | 'Packing List'
  | 'COO'
  | 'Insurance'
  | 'Commercial Invoice';

export type DocumentStatus =
  | 'Belum Upload'
  | 'Menunggu Verifikasi'
  | 'Disetujui'
  | 'Ditolak';

export type NodeStatus = 'completed' | 'current' | 'pending';

export interface CheckpointNode {
  id: string;
  name: string;
  status: NodeStatus;
  date?: string;
  time?: string;
  pic?: string;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  uploadedBy?: string;
  uploadedAt?: string;
  fileUrl?: string;
}

export interface ReportItem {
  id: string;
  template: string;
  type: string;
  createdBy: string;
  createdAt: string;
  syncStatus: 'Synced' | 'Pending' | 'Failed';
  reportUrl?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  location?: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  date: string;
  title: string;
  user: string;
  role?: string;
}

export interface CiCargoDetail {
  id: string;
  descriptionOfGoods: string;
  type: string;
  brand: string;
  quantity?: number | string;
  unit?: string;
  netWeight?: string;
  grossWeight?: string;
  price?: string;
  hsCode?: string;
}

export interface MonitoringItem {
  id: string;
  contractId: string;
  shippingSession: string;
  customerName: string;
  itemName: string;
  itemNames?: string[];
  itemType: string;
  itemTypes?: string[];
  itemCount?: number;
  origin: string;
  destination: string;
  status: ShippingStatus;
  lastUpdate: string;
  estimatedArrival: string;
  createdBy: string;
  currentCheckpoint: string;
  totalCheckpoints: number;
  completedCheckpoints: number;
  checkpoints: CheckpointNode[];
  documents: DocumentItem[];
  reports: ReportItem[];
  photos: PhotoItem[];
  activities: ActivityItem[];
  // ── Field Detail Barang ──
  itemCode?: string;
  currentLocation?: string;
  totalWeight?: string;
  model?: string;
  manufacturer?: string;
  finalDestination?: string;
  cargos?: CiCargoDetail[];
}
