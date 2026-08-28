import { useState, useMemo, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonitoringItem } from '../types/monitoringBarang';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils/formatter';

interface MonitoringTableProps {
  data: MonitoringItem[];
  onViewDetail: (item: MonitoringItem) => void;
  selectedId?: string;
  itemsPerPage?: number;
}

export function MonitoringTable({ data, onViewDetail, selectedId, itemsPerPage = 10 }: MonitoringTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const rangeStart = data.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, data.length);

  return (
    <div className="bg-white w-full overflow-hidden" style={{ borderRadius: 10, border: '1px solid #E5E7EB' }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ height: 42, borderBottom: '1px solid #F1F5F9' }}>
            {['No Kontrak & Assignment', 'Daftar Barang', 'Asal', 'Tujuan', 'Status', 'Update Terakhir', 'Aksi'].map((col) => (
              <th
                key={col}
                className="text-left px-4"
                style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item) => {
            const cargoList = item.cargos && item.cargos.length > 0 ? item.cargos : [];

            return (
              <tr
                key={item.id}
                onClick={() => onViewDetail(item)}
                className="cursor-pointer transition-colors duration-200"
                style={{
                  minHeight: 44,
                  backgroundColor: selectedId === item.id ? '#FFF8EC' : undefined,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8EC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedId === item.id ? '#FFF8EC' : '')}
              >
                {/* Kolom 1: Menampilkan No Kontrak berdasarkan No Assignment */}
                <td className="px-4 py-2.5 text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">
                      {item.contractId && item.contractId !== '-' ? item.contractId : item.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.shippingSession || item.id}
                    </span>
                  </div>
                </td>

                {/* Kolom 2: Menampilkan seluruh barang yang diisi aslinya */}
                <td className="px-4 text-xs py-2.5" style={{ color: '#334155' }}>
                  {cargoList.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {cargoList.map((cargo, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-800">
                            {cargo.descriptionOfGoods}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{item.itemName}</span>
                    </div>
                  )}
                </td>

                <td className="px-4 text-xs" style={{ color: '#334155' }}>{item.origin}</td>
                <td className="px-4 text-xs" style={{ color: '#334155' }}>{item.destination}</td>
                <td className="px-4"><StatusBadge status={item.status} /></td>
                <td className="px-4 text-xs" style={{ color: '#64748B' }}>{formatDateTime(item.lastUpdate)}</td>
                <td className="px-4">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onViewDetail(item); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150"
                    style={{ color: '#2563EB', backgroundColor: '#EFF6FF' }}
                  >
                    <Eye size={14} />
                    Detail
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        className="px-4 py-3 flex items-center justify-between text-xs"
        style={{ color: '#94A3B8', borderTop: '1px solid #F1F5F9' }}
      >
        <span>
          Menampilkan {rangeStart} - {rangeEnd} dari {data.length} data
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: '#334155' }}
              onMouseEnter={(e) => currentPage > 1 && (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span style={{ color: '#64748B' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: '#334155' }}
              onMouseEnter={(e) => currentPage < totalPages && (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
