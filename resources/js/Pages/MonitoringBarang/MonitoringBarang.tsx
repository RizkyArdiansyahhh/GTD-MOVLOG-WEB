import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { MonitoringItem } from './types/monitoringBarang';
import { MOCK_DATA } from './services/monitoringBarangApi';
import { MonitoringTable } from './components/MonitoringTable';
import { DetailBarangDrawer } from './components/DetailBarangDrawer';

interface MonitoringBarangProps {
  items?: MonitoringItem[];
}

export default function MonitoringBarang({ items: propItems }: MonitoringBarangProps) {
  const items = propItems && propItems.length > 0 ? propItems : MOCK_DATA;
  const [selectedItem, setSelectedItem] = useState<MonitoringItem | null>(null);

  return (
    <DashboardLayout title="Monitor Barang">
      <Head title="Monitor Barang" />

      <div className="p-6 flex gap-4" style={{ minHeight: '100%', fontFamily: "'Poppins', sans-serif" }}>
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 32, color: '#06283A' }}>
            Monitor Barang
          </h1>

          <MonitoringTable data={items} onViewDetail={setSelectedItem} selectedId={selectedItem?.id} />
        </div>

        {selectedItem && (
          <DetailBarangDrawer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}