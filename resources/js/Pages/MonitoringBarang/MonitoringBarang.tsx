import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { MonitoringItem } from './types/monitoringBarang';
import { MonitoringTable } from './components/MonitoringTable';
import { DetailBarangDrawer } from './components/DetailBarangDrawer';
import { PackageOpen } from 'lucide-react';

interface MonitoringBarangProps {
  items?: MonitoringItem[];
}

export default function MonitoringBarang({ items: propItems }: MonitoringBarangProps) {
  const pageProps = usePage<{ items?: MonitoringItem[] }>().props;
  const items = (propItems && propItems.length > 0) ? propItems : (pageProps.items ?? []);
  const [selectedItem, setSelectedItem] = useState<MonitoringItem | null>(null);

  return (
    <DashboardLayout title="Cargo Monitoring">
      <Head title="Cargo Monitoring" />

      <div className="p-6 flex gap-4" style={{ minHeight: '100%', fontFamily: "'Poppins', sans-serif" }}>
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 32, color: '#06283A' }}>
              Cargo Monitoring
            </h1>
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              Total Pengiriman: {items.length}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="p-3 bg-slate-50 rounded-full text-slate-400">
                <PackageOpen size={36} />
              </div>
              <h3 className="text-base font-semibold text-slate-700">Belum Ada Data Pengiriman</h3>
              <p className="text-slate-500 text-xs max-w-md">
                Cargo document data is not yet available. Please submit shipment assignment documents first via the <strong>Submit Documents</strong> menu.
              </p>
            </div>
          ) : (
            <MonitoringTable data={items} onViewDetail={setSelectedItem} selectedId={selectedItem?.id} />
          )}
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
