import { Link } from '@inertiajs/react';
import type { WorkSession } from '../types';
import { Eye, CheckCircle2 } from 'lucide-react';

interface SesiTableProps {
    sessions: WorkSession[];
}

export default function SesiTable({ sessions }: SesiTableProps) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-slate-500 text-sm font-medium">Tidak ada data sesi ditemukan.</p>
                <p className="text-slate-400 text-xs mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-[#E2E8F0]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr
                        style={{
                            backgroundColor: '#F8FAFB',
                            height: '44px',
                        }}
                        className="border-b border-[#E2E8F0]"
                    >
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '140px' }}
                        >
                            ID Sesi
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '250px' }}
                        >
                            Nama Unit / Kargo
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '200px' }}
                        >
                            Tahap Operasional
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '130px' }}
                        >
                            Status
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '180px' }}
                        >
                            PIC Tahap Aktif
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap text-right"
                            style={{ width: '100px' }}
                        >
                            Aksi
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {sessions.map((session) => {
                        const isDelivered = session.status === 'delivered';
                        const isInTransit = session.status === 'in_transit' || session.status === 'in_transitS';

                        return (
                            <tr
                                key={session.id}
                                style={{ height: '56px' }}
                                className="hover:bg-[#FAFBFC] transition-colors duration-150"
                            >
                                {/* 1. ID Sesi */}
                                <td className="px-4 py-3 font-mono text-xs font-bold text-[#06283A] whitespace-nowrap">
                                    {session.sessionId || session.id}
                                </td>

                                {/* 2. Nama Unit */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="font-semibold text-xs text-[#06283A] block">
                                        {session.unitName}
                                    </span>
                                </td>

                                {/* 3. Tahap Operasional (Clean Text / Badge tanpa garis step ramai) */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {isDelivered ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                            Site (Selesai)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-[#06283A]">
                                            <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
                                            {session.currentStage || 'Kapal'}
                                        </span>
                                    )}
                                </td>

                                {/* 4. Status Pengiriman */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {isDelivered ? (
                                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                            DELIVERED
                                        </span>
                                    ) : isInTransit ? (
                                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                            IN TRANSIT
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                            PENDING
                                        </span>
                                    )}
                                </td>

                                {/* 5. PIC Tahap Aktif */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {session.petugas && session.petugas !== '-' ? (
                                            <>
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#06283A] font-bold text-[10px]">
                                                    {session.petugas.split(' ').map((n) => n[0]).join('')}
                                                </div>
                                                <span className="text-xs font-medium text-slate-700">
                                                    {session.petugas}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </div>
                                </td>

                                {/* 6. Aksi */}
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <Link
                                        href={`/sesi-pekerja/${session.id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#06283A] bg-[#F5B800] hover:bg-[#E5AC00] transition-colors cursor-pointer shadow-2xs"
                                    >
                                        <Eye size={12} />
                                        Detail
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}