import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface CheckpointPipelineItem {
    name: string;
    count: number;
}

interface CheckpointPipelineChartProps {
    data?: CheckpointPipelineItem[];
    /** Label periode aktif, mis. "Jan 2025" / "2025" / "all years" / "All-time". */
    scopeLabel?: string;
    /** True saat filter periode eksplisit aktif → mode historis overlap. */
    isFiltered?: boolean;
}

export default function CheckpointPipelineChart({ data = [], scopeLabel = 'All-time', isFiltered = false }: CheckpointPipelineChartProps) {
    const hasData = data.length > 0;
    const totalActive = data.reduce((acc, item) => acc + item.count, 0);
    const badgeText = isFiltered
        ? `${totalActive} active · ${scopeLabel}`
        : `${totalActive} currently active`;
    const subtitle = isFiltered
        ? `Stages active during ${scopeLabel}`
        : 'Sessions currently active at each stage';
    const tooltipUnit = isFiltered ? 'active stages' : 'active sessions';

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-[#06283A]">Shipments by Checkpoint</h2>
                    <span className="text-xs text-slate-500 font-medium">
                        {badgeText}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    {subtitle}
                </p>
            </div>

            {!hasData ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                    No checkpoint data yet
                </div>
            ) : (
                <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <XAxis type="number" hide allowDecimals={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={85}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    color: '#06283A',
                                }}
                                formatter={(value: any) => [
                                    `${value ?? 0} ${tooltipUnit}`,
                                    'Count',
                                ]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#F6C343"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
