import type { WorkSession } from '../types';
import ProgressTimeline from './ProgressTimeline';
import { User } from 'lucide-react';

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
                            style={{ width: '130px' }}
                        >
                            ID Sesi
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '220px' }}
                        >
                            Nama Unit
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ minWidth: '290px' }}
                        >
                            Progress Logistik
                        </th>
                        <th
                            className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap"
                            style={{ width: '180px' }}
                        >
                            Petugas
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {sessions.map((session) => (
                        <tr
                            key={session.id}
                            style={{ height: '56px' }}
                            className="hover:bg-[#FAFBFC] transition-colors duration-150"
                        >
                            {/* 1. ID Sesi */}
                            <td className="px-4 py-2 font-mono text-sm font-bold text-[#06283A] whitespace-nowrap">
                                {session.id}
                            </td>

                            {/* 2. Nama Unit */}
                            <td className="px-4 py-2 whitespace-nowrap">
                                <span className="font-semibold text-sm text-[#06283A] block">
                                    {session.unitName}
                                </span>
                            </td>

                            {/* 3. Progress Logistik */}
                            <td className="px-4 py-2">
                                <ProgressTimeline currentStage={session.currentStage} />
                            </td>

                            {/* 4. Petugas */}
                            <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300/50 flex items-center justify-center text-[#06283A] font-bold text-xs">
                                        {session.petugas.split(' ').map((n) => n[0]).join('')}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {session.petugas}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
