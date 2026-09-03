import type { ShippingStatus } from '../types/monitoringBarang';

const STATUS_STYLES: Record<ShippingStatus, { bg: string; text: string }> = {
  'Dalam Perjalanan': { bg: '#FFF3E0', text: '#B45309' },
    'In Transit': { bg: '#FFF3E0', text: '#B45309' },
  'Sampai Tujuan': { bg: '#E6F6EA', text: '#15803D' },
  'Sampai Checkpoint': { bg: '#E5F0FF', text: '#1D4ED8' },
  'Terlambat': { bg: '#FDE8E8', text: '#DC2626' },
  'Menunggu': { bg: '#FEF9E7', text: '#B7950B' },
    'Pending': { bg: '#FEF9E7', text: '#B7950B' },
  'Dibatalkan': { bg: '#F1F5F9', text: '#64748B' },
    'Cancelled': { bg: '#F1F5F9', text: '#64748B' },
    'Delivered': { bg: '#E8F5E9', text: '#2E7D32' },
    'Pending Verification': { bg: '#FEF9E7', text: '#B7950B' },
};

export function StatusBadge({ status }: { status: ShippingStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES['Menunggu'];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{
        height: 20,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
}