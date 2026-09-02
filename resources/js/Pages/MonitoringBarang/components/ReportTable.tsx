import React from 'react';
import type { ReportItem } from '../types/monitoringBarang';

interface ReportTableProps {
    reports: ReportItem[];
}

const syncBadgeStyle: Record<ReportItem['syncStatus'], { bg: string; text: string }> = {
    Synced: { bg: '#DCFCE7', text: '#15803D' },
    Pending: { bg: '#FEF3C7', text: '#92400E' },
    Failed: { bg: '#FEE2E2', text: '#DC2626' },
};

export const ReportTable: React.FC<ReportTableProps> = ({ reports }) => {
    if (reports.length === 0) {
        return <p className="text-sm text-slate-400 text-center py-8">No reports available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Template</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipe</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dibuat Oleh</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tanggal</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sinkronisasi</th>
                        <th className="py-2 px-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => {
                        const sync = syncBadgeStyle[report.syncStatus];
                        return (
                            <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 font-medium text-slate-800">{report.template}</td>
                                <td className="py-3 px-3 text-slate-500">{report.type}</td>
                                <td className="py-3 px-3 text-slate-500">{report.createdBy}</td>
                                <td className="py-3 px-3 text-slate-500 font-mono text-xs">{report.createdAt}</td>
                                <td className="py-3 px-3">
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full"
                                        style={{ backgroundColor: sync.bg, color: sync.text }}
                                    >
                                        {report.syncStatus}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                    {report.reportUrl ? (
                                        <a
                                            href={report.reportUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Lihat
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-300">—</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
