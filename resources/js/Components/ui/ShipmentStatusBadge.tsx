import { Badge } from './Badge';

export function ShipmentStatusBadge({ status }: { status: string }) {
    const normalized = (status || '').toUpperCase().replaceAll(' ', '_');
    if (['IN_PROGRESS', 'IN_TRANSIT', 'DALAM_PERJALANAN'].includes(normalized)) return <Badge tone="info">In Transit</Badge>;
    if (['COMPLETED', 'DELIVERED', 'TERKIRIM', 'SAMPAI_TUJUAN'].includes(normalized)) return <Badge tone="success">Delivered</Badge>;
    if (['CANCELLED', 'DIBATALKAN'].includes(normalized)) return <Badge tone="neutral">Cancelled</Badge>;
    return <Badge tone="neutral">Loading Preparation</Badge>;
}
